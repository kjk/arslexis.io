package main

import (
	"sort"

	"github.com/kjk/common/siser"
)

type NameCount struct {
	Name  string
	Count int
}

type EventsStats struct {
	Counts []NameCount
}

func initEventsStats(stats *EventsStats) {
	// do nothing
}

func finalizeEventsStats(stats *EventsStats) {
	sort.Slice(stats.Counts, func(i, j int) bool {
		return stats.Counts[i].Count > stats.Counts[j].Count
	})
}

func processEventsRecord(r *siser.ReadRecord, stats *EventsStats) {
	panicIf(r.Name != "event", "expected 'event', got '%s'", r.Name)
	name, ok := r.Get("name")
	panicIf(!ok || name == "")
	for i, v := range stats.Counts {
		if v.Name == name {
			stats.Counts[i].Count++
			return
		}
	}
	stats.Counts = append(stats.Counts, NameCount{Name: name, Count: 1})
}

func dumpEventsStats(stats *EventsStats) string {
	s := "Events:\n"
	for _, v := range stats.Counts {
		s += f("%s: %d\n", v.Name, v.Count)
	}
	return s
}
