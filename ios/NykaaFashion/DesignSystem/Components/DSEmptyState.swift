import SwiftUI

/// Empty / error / no-results state. Wraps the native `ContentUnavailableView`
/// (correct layout, VoiceOver grouping and Dynamic Type for free) and only adds
/// our button style.
struct DSEmptyState: View {
    let title: LocalizedStringKey
    let message: LocalizedStringKey
    let systemImage: String
    var actionTitle: LocalizedStringKey? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
        } description: {
            Text(message)
        } actions: {
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.ds(.primary))
            }
        }
    }
}

#Preview {
    DSEmptyState(
        title: "Nothing saved yet",
        message: "Tap the heart on anything you like and it will show up here.",
        systemImage: "heart",
        actionTitle: "Start browsing",
        action: {}
    )
}
