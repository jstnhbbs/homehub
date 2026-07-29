import SwiftUI

struct NapsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var payload: NapsPayload?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var now = Date.now

    private let timer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    if isLoading && payload == nil {
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 240)
                    } else if let payload {
                        quickLogSection(payload)
                        historySection(payload)
                    }
                }
                .padding(24)
            }
            .background(HubTheme.surface)
            .navigationTitle("Nap log")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .refreshable { await load() }
            .task { await load() }
            .onReceive(timer) { date in
                now = date
            }
        }
    }

    @ViewBuilder
    private func quickLogSection(_ payload: NapsPayload) -> some View {
        HubCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Quick log", systemImage: "moon.fill")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(HubTheme.sage)

                if payload.childProfiles.isEmpty {
                    EmptyStateView(text: "Add a child profile in Settings to start logging naps.")
                } else {
                    ForEach(payload.childProfiles) { profile in
                        NapChildRowView(
                            profile: profile,
                            activeNap: NapHelpers.activeNap(for: profile.id, in: payload.naps),
                            timezone: TimeZone(identifier: appState.household?.timezone ?? "") ?? .current,
                            now: now
                        ) {
                            await startNap(profileId: profile.id)
                        } endAction: {
                            if let nap = NapHelpers.activeNap(for: profile.id, in: payload.naps) {
                                await endNap(napId: nap.id)
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func historySection(_ payload: NapsPayload) -> some View {
        HubCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Today's naps")
                    .font(.title3.weight(.semibold))

                if payload.naps.isEmpty {
                    Text("No naps logged yet today.")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HubTheme.muted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                } else {
                    ForEach(payload.naps) { nap in
                        if let profile = payload.childProfiles.first(where: { $0.id == nap.profileId })
                            ?? appState.dashboard?.profiles.first(where: { $0.id == nap.profileId }) {
                            NapHistoryRowView(
                                nap: nap,
                                profile: profile,
                                timezone: TimeZone(identifier: appState.household?.timezone ?? "") ?? .current,
                                now: now,
                                endAction: nap.endedAt == nil ? { await endNap(napId: nap.id) } : nil,
                                deleteAction: { await deleteNap(id: nap.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            payload = try await appState.api.fetchNaps()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func startNap(profileId: String) async {
        do {
            try await appState.api.startNap(profileId: profileId)
            await appState.refreshDashboard()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func endNap(napId: String) async {
        do {
            try await appState.api.endNap(napId: napId)
            await appState.refreshDashboard()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteNap(id: String) async {
        do {
            try await appState.api.deleteNap(id: id)
            await appState.refreshDashboard()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct NapChildRowView: View {
    let profile: Profile
    let activeNap: NapLog?
    let timezone: TimeZone
    let now: Date
    let startAction: () async -> Void
    let endAction: () async -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(HubTheme.profileColor(profile.color))
                .frame(width: 12, height: 12)

            VStack(alignment: .leading, spacing: 2) {
                Text(profile.name)
                    .font(.subheadline.weight(.bold))
                if let activeNap {
                    Text("Asleep since \(DateHelpers.timeString(activeNap.startedAt, timezone: timezone)) · \(durationLabel(for: activeNap))")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HubTheme.muted)
                } else {
                    Text("No active nap")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HubTheme.muted)
                }
            }

            Spacer()

            if activeNap != nil {
                Button("End nap") {
                    Task { await endAction() }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            } else {
                Button("Start nap") {
                    Task { await startAction() }
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .padding(12)
        .background(HubTheme.tileQuiet)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func durationLabel(for nap: NapLog) -> String {
        NapHelpers.formatDuration(
            minutes: NapHelpers.durationMinutes(
                startedAt: nap.startedAt,
                endedAt: nap.endedAt,
                now: now
            )
        )
    }
}

private struct NapHistoryRowView: View {
    let nap: NapLog
    let profile: Profile
    let timezone: TimeZone
    let now: Date
    let endAction: (() async -> Void)?
    let deleteAction: () async -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(HubTheme.profileColor(profile.color))
                .frame(width: 12, height: 12)

            VStack(alignment: .leading, spacing: 2) {
                Text(profile.name)
                    .font(.subheadline.weight(.bold))
                Text("\(DateHelpers.timeString(nap.startedAt, timezone: timezone)) – \(endLabel) · \(durationLabel)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HubTheme.muted)
            }

            Spacer()

            if let endAction {
                Button("End") {
                    Task { await endAction() }
                }
                .buttonStyle(.bordered)
                .controlSize(.mini)
            }

            Button("Delete", role: .destructive) {
                Task { await deleteAction() }
            }
            .font(.caption.weight(.bold))
        }
        .padding(.vertical, 8)
    }

    private var endLabel: String {
        guard let endedAt = nap.endedAt else { return "In progress" }
        return DateHelpers.timeString(endedAt, timezone: timezone)
    }

    private var durationLabel: String {
        NapHelpers.formatDuration(
            minutes: NapHelpers.durationMinutes(
                startedAt: nap.startedAt,
                endedAt: nap.endedAt,
                now: now
            )
        )
    }
}
