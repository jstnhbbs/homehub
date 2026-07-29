import Foundation

enum NapHelpers {
    static func durationMinutes(startedAt: Date, endedAt: Date?, now: Date = .now) -> Int {
        let end = endedAt ?? now
        return max(0, Int(end.timeIntervalSince(startedAt) / 60))
    }

    static func formatDuration(minutes: Int) -> String {
        if minutes < 60 { return "\(minutes)m" }
        let hours = minutes / 60
        let remainder = minutes % 60
        return remainder == 0 ? "\(hours)h" : "\(hours)h \(remainder)m"
    }

    static func childProfiles(from profiles: [Profile]) -> [Profile] {
        profiles.filter { $0.profileType == .child }
    }

    static func activeNap(for profileId: String, in naps: [NapLog]) -> NapLog? {
        naps.first { $0.profileId == profileId && $0.endedAt == nil }
    }

    static func todayNaps(for profileId: String, in naps: [NapLog], localDate: String) -> [NapLog] {
        naps.filter { $0.profileId == profileId && $0.localDate == localDate }
    }

    static func todaySummary(
        for profileId: String,
        in naps: [NapLog],
        localDate: String,
        now: Date = .now,
        isActive: Bool = false
    ) -> String {
        let todayNaps = Self.todayNaps(for: profileId, in: naps, localDate: localDate)
        if todayNaps.isEmpty { return "No naps logged today" }

        let count = todayNaps.count
        let totalMinutes = todayNaps.reduce(0) { partial, nap in
            partial + Self.durationMinutes(startedAt: nap.startedAt, endedAt: nap.endedAt, now: now)
        }

        var parts = [
            "\(count) nap\(count == 1 ? "" : "s")",
            "\(Self.formatDuration(minutes: totalMinutes)) total",
        ]

        if !isActive,
           let lastEnded = todayNaps.compactMap(\.endedAt).max() {
            let awakeMinutes = max(0, Int(now.timeIntervalSince(lastEnded) / 60))
            parts.append("Awake \(Self.formatDuration(minutes: awakeMinutes))")
        }

        return parts.joined(separator: " · ")
    }
}
