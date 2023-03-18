package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/kjk/common/u"
)

// return false to exclude a file
func excludeFiles(s string) bool {
	return true
}

var srcFiles = u.MakeAllowedFileFilterForExts(".go", ".svelte", ".js", ".html")
var excludeDirs = u.MakeExcludeDirsFilter("node_modules", "icons", "dist")
var allFiles = u.MakeFilterAnd(excludeDirs, excludeFiles, srcFiles)

func doLineCount() int {
	stats := u.NewLineStats()
	err := stats.CalcInDir(".", allFiles, true)
	if err != nil {
		logf(ctx(), "doWordCount: stats.wcInDir() failed with '%s'\n", err)
		return 1
	}
	u.PrintLineStats(stats)
	return 0
}

func lineCountDaily() {
	defer func() {
		cmd := exec.Command("git", "checkout", "main")
		err := cmd.Run()
		if err != nil {
			fmt.Printf("exec.Command(git checkout main) failed with '%s'\n", err)
		}
	}()

	cmd := exec.Command("git", "log", `--pretty=format:%h%x09%ad`, "--date=short", "--reverse")
	out, err := cmd.CombinedOutput()
	must(err)
	// logf(ctx(), "%s\n", string(out))
	lines := strings.Split(string(out), "\n")

	pad := func(s string, n int) string {
		for len(s) < n {
			s = " " + s
		}
		return s
	}

	prevTotal := 0
	statsPerDay := func(dayNo int, day, hash string) {
		// logf(ctx(), "%s: %s\n", day, hash)
		cmd = exec.Command("git", "checkout", hash)
		out, err := cmd.CombinedOutput()
		if err != nil {
			logf(ctx(), "%s failed with '%s', out:\n%s\n", cmd, err, string(out))
			os.Exit(1)
		}
		stats := u.NewLineStats()
		err = stats.CalcInDir(".", allFiles, true)
		must(err)
		total := 0
		for _, nLines := range stats.FileToCount {
			total += nLines.LineCount
		}
		nDiff := total - prevTotal
		diffStr := fmt.Sprintf("%d", nDiff)
		if nDiff > 0 {
			diffStr = "+" + diffStr
		}
		diffStr = pad(diffStr, 5)
		logf(ctx(), "%s, day % 3d: % 5d %s", day, dayNo, total, diffStr)
		lineCount := u.LineStatsPerExt(stats.FileToCount)
		a := []string{}
		for _, lc := range lineCount {
			s := fmt.Sprintf("%s: %d", lc.Ext, lc.LineCount)
			a = append(a, s)
		}
		s := strings.Join(a, ", ")
		logf(ctx(), " (%s)\n", s)
		prevTotal = total
	}

	lastDay := ""
	lastHash := ""
	dayNo := 1
	for _, l := range lines {
		parts := strings.Split(l, "\t")
		hash := parts[0]
		day := parts[1]
		// logf(ctx(), "%s: %s\n", day, hash)
		if day != lastDay {
			if lastHash != "" {
				statsPerDay(dayNo, lastDay, lastHash)
				dayNo++
				// logf(ctx(), "%s: %s remembered\n", lastDay, lastHash)
			}
		}
		lastDay = day
		lastHash = hash
	}
	statsPerDay(dayNo, lastDay, lastHash)
	perDay := prevTotal / dayNo
	logf(ctx(), "per day: (%d / %d) = %d\n", prevTotal, dayNo, perDay)
}
