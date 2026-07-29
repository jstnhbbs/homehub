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
}
