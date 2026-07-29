import Foundation

struct ChildDayNapStats: Sendable {
    let localDate: String
    let napCount: Int
    let totalMinutes: Int
}

struct ChildWeekNapStats: Sendable {
    let profileId: String
    let days: [ChildDayNapStats]
    let totalNaps: Int
    let totalMinutes: Int
    let avgNapsPerDay: Double
    let avgMinutesPerDay: Double
    let elapsedDays: Int
}

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

    static func daySummary(napCount: Int, totalMinutes: Int) -> String {
        if napCount == 0 { return "No naps" }
        return "\(napCount) nap\(napCount == 1 ? "" : "s") · \(formatDuration(minutes: totalMinutes)) total"
    }

    static func formatAverageNapCount(_ value: Double) -> String {
        if value.rounded(.towardZero) == value { return String(Int(value)) }
        return String(format: "%.1f", value)
    }

    static func childWeekStats(
        profileId: String,
        naps: [NapLog],
        weekDates: [String],
        todayLocalDate: String,
        now: Date = .now
    ) -> ChildWeekNapStats {
        let days = weekDates.map { localDate in
            let dayNaps = todayNaps(for: profileId, in: naps, localDate: localDate)
            let totalMinutes = dayNaps.reduce(0) { partial, nap in
                partial + durationMinutes(startedAt: nap.startedAt, endedAt: nap.endedAt, now: now)
            }
            return ChildDayNapStats(localDate: localDate, napCount: dayNaps.count, totalMinutes: totalMinutes)
        }
        let elapsedDays = weekDates.filter { $0 <= todayLocalDate }.count
        let totalNaps = days.reduce(0) { $0 + $1.napCount }
        let totalMinutes = days.reduce(0) { $0 + $1.totalMinutes }
        let avgDivisor = max(elapsedDays, 1)

        return ChildWeekNapStats(
            profileId: profileId,
            days: days,
            totalNaps: totalNaps,
            totalMinutes: totalMinutes,
            avgNapsPerDay: Double(totalNaps) / Double(avgDivisor),
            avgMinutesPerDay: Double(totalMinutes) / Double(avgDivisor),
            elapsedDays: elapsedDays
        )
    }
}
