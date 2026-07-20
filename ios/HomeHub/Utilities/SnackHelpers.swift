import Foundation

enum SnackHelpers {
    static func parseSnackOptions(_ value: String?) -> [String] {
        guard let value, !value.isEmpty else { return [] }
        return value
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    static func serializeSnackOptions(_ lines: [String]) -> String {
        lines.joined(separator: "\n")
    }

    /// Unchecked snacks first (original order), then checked snacks at the bottom.
    static func sortedSnackOptions(_ options: [String], eaten: Set<String>) -> [String] {
        let pending = options.filter { !eaten.contains($0) }
        let done = options.filter { eaten.contains($0) }
        return pending + done
    }
}
