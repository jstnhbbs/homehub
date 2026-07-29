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

struct NapTimelineBar: Identifiable, Sendable {
    var id: String { napId }
    let napId: String
    let leftPercent: Double
    let widthPercent: Double
    let durationLabel: String
}

struct AwakeGap: Identifiable, Sendable {
    var id: String { "\(leftPercent)-\(minutes)" }
    let leftPercent: Double
    let widthPercent: Double
    let minutes: Int
    let label: String
}

struct HeatmapBlock: Sendable {
    let startHour: Int
    let endHour: Int
    let label: String
}

enum NapTimelineHelpers {
    static let startHour = 5
    static let endHour = 21
    static let hourLabels = ["5a", "8a", "11a", "2p", "5p", "8p"]
    static let heatmapBlocks: [HeatmapBlock] = [
        HeatmapBlock(startHour: 5, endHour: 8, label: "5–8a"),
        HeatmapBlock(startHour: 8, endHour: 11, label: "8–11a"),
        HeatmapBlock(startHour: 11, endHour: 14, label: "11–2p"),
        HeatmapBlock(startHour: 14, endHour: 17, label: "2–5p"),
        HeatmapBlock(startHour: 17, endHour: 20, label: "5–8p"),
        HeatmapBlock(startHour: 20, endHour: 23, label: "8–11p"),
    ]

    static func minutesOnLocalDate(_ date: Date, localDate: String, timezone: TimeZone) -> Int? {
        guard DateHelpers.localDateIn(timezone: timezone, date: date) == localDate else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timezone
        return calendar.component(.hour, from: date) * 60 + calendar.component(.minute, from: date)
    }

    static func timelinePercents(startMinutes: Int, endMinutes: Int) -> (left: Double, width: Double) {
        let rangeStart = startHour * 60
        let rangeEnd = endHour * 60
        let rangeDuration = rangeEnd - rangeStart
        let clampedStart = max(rangeStart, min(rangeEnd, startMinutes))
        let clampedEnd = max(clampedStart, min(rangeEnd, endMinutes))
        let left = Double(clampedStart - rangeStart) / Double(rangeDuration) * 100
        let width = max(Double(clampedEnd - clampedStart) / Double(rangeDuration) * 100, 1.5)
        return (left, width)
    }

    static func dayTimelineBars(naps: [NapLog], localDate: String, timezone: TimeZone, now: Date = .now) -> [NapTimelineBar] {
        naps.filter { $0.localDate == localDate }.sorted { $0.startedAt < $1.startedAt }.compactMap { nap in
            guard let startMinutes = minutesOnLocalDate(nap.startedAt, localDate: localDate, timezone: timezone) else { return nil }
            let endDate = nap.endedAt ?? now
            var endMinutes = minutesOnLocalDate(endDate, localDate: localDate, timezone: timezone) ?? endHour * 60
            if endMinutes <= startMinutes { return nil }
            let percents = timelinePercents(startMinutes: startMinutes, endMinutes: endMinutes)
            let duration = NapHelpers.durationMinutes(startedAt: nap.startedAt, endedAt: nap.endedAt, now: now)
            return NapTimelineBar(
                napId: nap.id,
                leftPercent: percents.left,
                widthPercent: percents.width,
                durationLabel: NapHelpers.formatDuration(minutes: duration)
            )
        }
    }

    static func awakeGaps(naps: [NapLog], localDate: String, timezone: TimeZone) -> [AwakeGap] {
        let sorted = naps.filter { $0.localDate == localDate && $0.endedAt != nil }.sorted { $0.startedAt < $1.startedAt }
        var gaps: [AwakeGap] = []
        for index in 1..<sorted.count {
            let previous = sorted[index - 1]
            let current = sorted[index]
            guard let previousEnd = previous.endedAt else { continue }
            let gapMinutes = max(0, Int(current.startedAt.timeIntervalSince(previousEnd) / 60))
            if gapMinutes < 5 { continue }
            guard
                let gapStart = minutesOnLocalDate(previousEnd, localDate: localDate, timezone: timezone),
                let gapEnd = minutesOnLocalDate(current.startedAt, localDate: localDate, timezone: timezone)
            else { continue }
            let percents = timelinePercents(startMinutes: gapStart, endMinutes: gapEnd)
            gaps.append(AwakeGap(
                leftPercent: percents.left,
                widthPercent: percents.width,
                minutes: gapMinutes,
                label: "Awake \(NapHelpers.formatDuration(minutes: gapMinutes))"
            ))
        }
        return gaps
    }

    static func overlapsHeatmapBlock(nap: NapLog, localDate: String, timezone: TimeZone, block: HeatmapBlock, now: Date = .now) -> Bool {
        guard nap.localDate == localDate,
              let startMinutes = minutesOnLocalDate(nap.startedAt, localDate: localDate, timezone: timezone) else { return false }
        let endDate = nap.endedAt ?? now
        let endMinutes = minutesOnLocalDate(endDate, localDate: localDate, timezone: timezone) ?? block.endHour * 60
        return startMinutes < block.endHour * 60 && endMinutes > block.startHour * 60
    }
}
