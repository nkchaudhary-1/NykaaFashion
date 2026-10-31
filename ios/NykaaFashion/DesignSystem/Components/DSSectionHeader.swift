import SwiftUI

/// Title row for a content section, with an optional trailing action
/// ("See all"). The title carries the `.isHeader` trait so VoiceOver users can
/// jump between sections with the rotor.
struct DSSectionHeader: View {
    let title: LocalizedStringKey
    var actionTitle: LocalizedStringKey? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(DSFont.title)
                .foregroundStyle(DSColor.textPrimary)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: DSSpacing.md)
            if let actionTitle, let action {
                // Native text button: stays flush with the screen gutter and
                // takes the system tint. (`.ds(.tertiary)` adds button padding.)
                Button(actionTitle, action: action)
                    .font(DSFont.callout)
                    .frame(minHeight: DSSize.minTap)
            }
        }
    }
}

#Preview {
    DSSectionHeader(title: "New in", actionTitle: "See all") {}
        .padding()
}
