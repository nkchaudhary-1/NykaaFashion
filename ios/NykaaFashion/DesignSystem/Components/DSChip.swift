import SwiftUI

/// Selectable chip (filters, sizes, quick categories). A native `Button` with a
/// custom look; selection is announced to VoiceOver via the `.isSelected` trait.
struct DSChip: View {
    let title: LocalizedStringKey
    var systemImage: String? = nil
    var isSelected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DSSpacing.xs) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
            }
            .font(DSFont.callout)
            .padding(.horizontal, DSSpacing.md)
            .frame(minHeight: DSSize.minTap)
            .foregroundStyle(isSelected ? DSColor.onAccent : DSColor.textPrimary)
            .background(isSelected ? DSColor.accent : DSColor.fill, in: Capsule())
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isSelected)
        .animation(DSMotion.quick, value: isSelected)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

/// Small non-interactive status label. The text always carries the meaning —
/// colour only reinforces it (never colour alone).
struct DSBadge: View {
    enum Tone { case neutral, accent, success, warning, danger }

    let text: LocalizedStringKey
    var tone: Tone = .neutral

    var body: some View {
        Text(text)
            .font(DSFont.eyebrow)
            .tracking(0.6)
            .textCase(.uppercase)
            .padding(.horizontal, DSSpacing.sm)
            .padding(.vertical, DSSpacing.xs)
            .foregroundStyle(color)
            .background(color.opacity(0.14), in: Capsule())
    }

    private var color: Color {
        switch tone {
        case .neutral: DSColor.textSecondary
        case .accent: DSColor.accent
        case .success: DSColor.success
        case .warning: DSColor.warning
        case .danger: DSColor.danger
        }
    }
}

#Preview {
    VStack(alignment: .leading, spacing: DSSpacing.lg) {
        HStack {
            DSChip(title: "All", isSelected: true) {}
            DSChip(title: "Dresses", isSelected: false) {}
            DSChip(title: "Under ₹2,000", systemImage: "indianrupeesign", isSelected: false) {}
        }
        HStack {
            DSBadge(text: "New")
            DSBadge(text: "Sale", tone: .danger)
            DSBadge(text: "Few left", tone: .warning)
            DSBadge(text: "In stock", tone: .success)
        }
    }
    .padding()
}
