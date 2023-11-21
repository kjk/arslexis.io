package main

import (
	"bufio"
	"time"

	"github.com/kjk/common/siser"
	"github.com/kjk/common/u"
)

type LogStats struct {
	HTTPStats
	EventsStats

	TotalRecs      int
	EventsRecs     int
	ProcessingTime time.Duration
}

func statsSLogFile(path string) (*LogStats, error) {
	logf("statsSLogFile: path='%s'\n", path)
	timeStart := time.Now()
	f, err := u.OpenFileMaybeCompressed(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	sr := siser.NewReader(bufio.NewReader(f))

	var stats LogStats
	initHTTPStats(&stats.HTTPStats)
	initEventsStats(&stats.EventsStats)

	for sr.ReadNextRecord() {
		stats.TotalRecs++
		r := sr.Record
		if r.Name == "http" {
			stats.HTTPReqs++
			processHTTPStatsRecord(r, &stats.HTTPStats)
		} else if r.Name == "event" {
			stats.EventsRecs++
			processEventsRecord(r, &stats.EventsStats)
		}
	}
	finalizeHTTPStats(&stats.HTTPStats)
	finalizeEventsStats(&stats.EventsStats)
	stats.ProcessingTime = time.Since(timeStart)
	return &stats, nil
}

func parseSLogStats(path string, maxHit int, minCount int) string {
	stats, err := statsSLogFile(path)
	if err != nil {
		return f("statsSLogFile('%s') failed with '%s'\n", path, err)
	}
	s := "build: https://github.com/sumatrapdfreader/sumatra-website/commit/" + GitCommitHash + "\n"
	s += f("path: %s\n", path)
	s += f("stat processing time: %s\n", stats.ProcessingTime)
	s += f("statsSLogFile: TotalRecs=%d, Events: %d, HTTPReqs: %d\n", stats.TotalRecs, stats.EventsRecs, stats.HTTPReqs)
	s += dumpHTTPStats(&stats.HTTPStats, maxHit, minCount)
	s += "\n" + dumpEventsStats(&stats.EventsStats)
	return s
}
