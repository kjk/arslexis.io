package server

import (
	"net/url"
	"slices"
	"sort"
	"strconv"
	"strings"

	"github.com/kjk/common/siser"
	"github.com/mileusna/useragent"
	"github.com/rodaine/table"
)

const (
	slowReqThresholdMs     = 100
	largeReqThresholdBytes = 200 * 1024
)

type URLCount struct {
	URL   string
	Count int
}

type SlowReq struct {
	URI     string
	TimesMs []int
}

type VerCount struct {
	Ver   string
	Count int
}

type OSVer struct {
	OS       string
	Count    int
	Versions []*VerCount
}

func shouldFilter(uri string, prefixes []string, suffixes []string) bool {
	for _, s := range prefixes {
		if strings.HasPrefix(uri, s) {
			return true
		}
	}
	for _, s := range suffixes {
		if strings.HasSuffix(uri, s) {
			return true
		}
	}
	return false
}

func filterFuncForHTTPCode(code int) func(string) bool {
	if code < 400 {
		return func(uri string) bool {
			return shouldFilter(uri, filter200Prefixes, filter200Suffixes)
		}
	}
	return func(uri string) bool {
		return shouldFilter(uri, filter404Prefixes, filter404Suffixes)
	}
}

func urlStatsFromHits(mHits map[string]int, max int, filter func(s string) bool) []URLCount {
	res := []URLCount{}
	for uri, n := range mHits {
		if filter != nil && filter(uri) {
			continue
		}
		res = append(res, URLCount{URL: uri, Count: n})
	}

	sort.Slice(res, func(i, j int) bool {
		c1, c2 := res[i].Count, res[j].Count
		if c1 == c2 {
			return res[i].URL > res[j].URL
		}
		return c1 > c2
	})
	if max > 0 && len(res) > max {
		res = res[:max]
	}
	return res
}

func addOSVer(os string, ver string, ap *[]*OSVer) {
	if os == "" || ver == "" {
		return
	}
	for _, v := range *ap {
		if v.OS == os {
			v.Count++
			for _, v2 := range v.Versions {
				if v2.Ver == ver {
					v2.Count++
					return
				}
			}
			verCount := VerCount{Ver: ver, Count: 1}
			push(&v.Versions, &verCount)
			return
		}
	}

	verCount := VerCount{Ver: ver, Count: 1}
	v := OSVer{
		OS:       os,
		Count:    1,
		Versions: []*VerCount{&verCount},
	}
	push(ap, &v)
}

type HTTPStats struct {
	// we consider each unique ip address a visit
	Visits     int
	HTTPReqs   int
	SlowReqs   []SlowReq
	OSVersions []*OSVer

	// this is temporary state
	urlStats map[int]map[string]int // maps http code to map of uri to count
	largeReq map[string]int
	visits   map[string]bool  // set of unique ips
	slowReq  map[string][]int // maps http code to map of uri to count
}

func sortOSVer(osVer []*OSVer) {
	for _, v := range osVer {
		sort.Slice(v.Versions, func(i, j int) bool {
			return v.Versions[i].Count > v.Versions[j].Count
		})
	}
	sort.Slice(osVer, func(i, j int) bool {
		return osVer[i].Count > osVer[j].Count
	})
}

func initHTTPStats(stats *HTTPStats) {
	stats.urlStats = map[int]map[string]int{}
	stats.largeReq = map[string]int{}
	stats.visits = map[string]bool{}
	// maps http code to map of uri to count
	stats.slowReq = map[string][]int{}
}

func processHTTPStatsRecord(r *siser.ReadRecord, stats *HTTPStats) {
	panicIf(r.Name != "http")
	stats.HTTPReqs++
	firstIP := false
	if ip, ok := r.Get("ipaddr"); ok && ip != "" {
		firstIP = !stats.visits[ip]
		stats.visits[ip] = true
	}
	req, ok := r.Get("req")
	panicIf(!ok || req == "")
	parts := strings.Split(req, " ")
	panicIf(len(parts) != 3)
	code, err := strconv.Atoi(parts[2]) // 200, 404 etc.
	must(err)
	uriRaw := parts[1]
	urlParsed, err := url.Parse(uriRaw)
	must(err)
	uri := urlParsed.Path
	m := stats.urlStats[code]
	if m == nil {
		m = map[string]int{}
		stats.urlStats[code] = m
	}
	m[uri]++

	if firstIP {
		// TODO: needs to use case-insensitive comparison
		uaFull, ok := r.Get("User-Agent")
		if ok && uaFull != "" {
			ua := useragent.Parse(uaFull)
			addOSVer(ua.OS, ua.OSVersion, &stats.OSVersions)
		}
	}

	durMicro, ok := r.Get("durmicro")
	if ok && durMicro != "" {
		durMicroInt, err := strconv.Atoi(durMicro)
		must(err)
		durMilliseconds := durMicroInt / 1000
		if durMilliseconds > slowReqThresholdMs {
			stats.slowReq[uri] = append(stats.slowReq[uri], durMilliseconds)
		}
	}
	size, ok := r.Get("size")
	if ok && size != "" {
		sizeInt, err := strconv.Atoi(size)
		must(err)
		if sizeInt > largeReqThresholdBytes {
			stats.largeReq[uri]++
		}
	}
}

func finalizeHTTPStats(stats *HTTPStats) {
	stats.Visits = len(stats.visits)
	for uri, times := range stats.slowReq {
		stats.SlowReqs = append(stats.SlowReqs, SlowReq{URI: uri, TimesMs: times})
	}
	sort.Slice(stats.SlowReqs, func(i, j int) bool {
		t1 := slices.Max(stats.SlowReqs[i].TimesMs)
		t2 := slices.Max(stats.SlowReqs[j].TimesMs)
		return t1 > t2
	})
	sortOSVer(stats.OSVersions)
}

func dumpHTTPStats(stats *HTTPStats, maxHit int, minCount int) string {
	var buf strings.Builder
	var tbl table.Table
	s := ""
	s += f("visits: %d\n", stats.Visits)
	s += f("\nslow reqs (> %d ms): %d\n", slowReqThresholdMs, len(stats.SlowReqs))
	buf.Reset()
	tbl = table.New("", "uri", "count", "times in ms").WithWriter(&buf)
	for i, slow := range stats.SlowReqs {
		if i >= 5 {
			continue
		}
		tbl.AddRow("", slow.URI, len(slow.TimesMs), sliceLimit(slow.TimesMs, 5))
	}
	tbl.Print()
	s += buf.String()

	s += f("\nlarge reqs (> %d bytes): %d\n", largeReqThresholdBytes, len(stats.largeReq))
	for uri, n := range stats.largeReq {
		s += f("  %s: %d\n", uri, n)
	}

	for code, m := range stats.urlStats {
		{
			s += f("\nurl stats %d:\n", code)
			buf.Reset()
			tbl = table.New("", "Count", "URL").WithWriter(&buf)
			hits := urlStatsFromHits(m, maxHit, filterFuncForHTTPCode(code))
			for _, hit := range hits {
				if hit.Count < minCount {
					continue
				}
				tbl.AddRow("", hit.Count, hit.URL)
			}
			tbl.Print()
			s += buf.String()
		}
	}

	s += f("\nos / ver stats:\n")
	for _, stat := range stats.OSVersions {
		s += f("\n%s: %d\n", stat.OS, stat.Count)
		for _, ver := range stat.Versions {
			if ver.Count > 10 {
				s += f("%8s: %d\n", ver.Ver, ver.Count)
			}
		}
	}
	return s
}
