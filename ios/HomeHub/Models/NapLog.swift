import Foundation

struct NapLog: Codable, Identifiable, Sendable {
    let id: String
    let profileId: String
    let localDate: String
    let startedAt: Date
    let endedAt: Date?
    let notes: String?
}

struct NapsPayload: Codable, Sendable {
    let localDate: String
    let yesterdayLocalDate: String
    let weekDates: [String]
    let childProfiles: [Profile]
    let naps: [NapLog]
    let yesterdayNaps: [NapLog]
    let weekNaps: [NapLog]
}

struct NapActionRequest: Encodable, Sendable {
    let action: String
    var profileId: String?
    var napId: String?
    var startedAt: Date?
    var endedAt: Date?
}

struct UpdateNapRequest: Encodable, Sendable {
    let startedAt: Date
    let endedAt: Date?
}
