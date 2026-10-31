import SwiftUI

enum DSButtonKind {
    case primary    // the one main action on a screen
    case secondary  // outlined
    case tertiary   // text-only
}

/// Custom look on a NATIVE `Button`. Using a ButtonStyle (not a bespoke view)
/// keeps system behaviour for free: VoiceOver traits, keyboard/pointer support,
/// disabled state, Dynamic Type and the tap target.
///
///     Button("Add to bag") { … }.buttonStyle(.ds(.primary, fullWidth: true))
struct DSButtonStyle: ButtonStyle {
    var kind: DSButtonKind = .primary
    var fullWidth = false

    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: DSRadius.md, style: .continuous)
        configuration.label
            .font(DSFont.headline)
            .padding(.horizontal, DSSpacing.xl)
            .frame(minHeight: DSSize.minTap)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .foregroundStyle(foreground)
            .background(background(pressed: configuration.isPressed), in: shape)
            .overlay {
                if kind == .secondary {
                    shape.strokeBorder(DSColor.separatorStrong, lineWidth: 1)
                }
            }
            .contentShape(shape)
            .opacity(isEnabled ? 1 : 0.4)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(DSMotion.quick, value: configuration.isPressed)
            .sensoryFeedback(.impact(weight: .light), trigger: configuration.isPressed) { _, pressed in pressed }
    }

    private var foreground: Color {
        switch kind {
        case .primary: DSColor.onAccent
        case .secondary, .tertiary: DSColor.textPrimary
        }
    }

    private func background(pressed: Bool) -> Color {
        switch kind {
        case .primary: DSColor.accent.opacity(pressed ? 0.85 : 1)
        case .secondary: pressed ? DSColor.fill : .clear
        case .tertiary: .clear
        }
    }
}

extension ButtonStyle where Self == DSButtonStyle {
    static func ds(_ kind: DSButtonKind = .primary, fullWidth: Bool = false) -> DSButtonStyle {
        DSButtonStyle(kind: kind, fullWidth: fullWidth)
    }
}

#Preview {
    VStack(spacing: DSSpacing.lg) {
        Button("Primary") {}.buttonStyle(.ds(.primary))
        Button("Secondary") {}.buttonStyle(.ds(.secondary))
        Button("Tertiary") {}.buttonStyle(.ds(.tertiary))
        Button("Full width, disabled") {}.buttonStyle(.ds(.primary, fullWidth: true)).disabled(true)
    }
    .padding()
}
