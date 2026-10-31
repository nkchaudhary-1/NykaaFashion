import SwiftUI

extension DSTextStyle {
    /// The system text style whose Dynamic Type curve this style scales along.
    /// Only the scaling behaviour comes from it — size, weight and face are ours.
    var textStyle: Font.TextStyle {
        switch size {
        case 30...: .largeTitle      // 32
        case 23..<30: .title2        // 24
        case 19..<23: .title3        // 20
        case 15.5..<19: .callout     // 16
        case 13.5..<15.5: .subheadline // 14
        case 11.5..<13.5: .caption   // 12
        default: .caption2           // 10
        }
    }

    /// `Font.custom(_:size:relativeTo:)` keeps the custom face AND scales with
    /// Dynamic Type. Base sizes are Figma's, so layout matches the design at the
    /// default text size.
    var font: Font {
        let base = Font.custom(face.postScriptName, size: size, relativeTo: textStyle)
        return tabularFigures ? base.monospacedDigit() : base
    }
}

private struct DSTextStyleModifier: ViewModifier {
    let style: DSTextStyle

    /// Scales with Dynamic Type alongside the font, so the line height keeps its
    /// proportion to the text at every size.
    @ScaledMetric private var extraLineSpacing: CGFloat

    init(_ style: DSTextStyle) {
        self.style = style
        _extraLineSpacing = ScaledMetric(wrappedValue: style.lineSpacingAdjustment, relativeTo: style.textStyle)
    }

    func body(content: Content) -> some View {
        content
            .font(style.font)
            .tracking(style.tracking)
            .lineSpacing(extraLineSpacing)
    }
}

extension View {
    /// Applies a type-scale style: face, size, letter spacing and line height.
    ///
    ///     Text("Add to bag").dsText(.subtitleSB1)
    ///
    /// Prefer this to `.font(_:)` so tracking and line height come with it. It
    /// sets environment values, so on a container it becomes the default for the
    /// text inside — a style set closer to a `Text` wins over one set further out.
    func dsText(_ style: DSTextStyle) -> some View {
        modifier(DSTextStyleModifier(style))
    }
}

#Preview {
    ScrollView {
        VStack(alignment: .leading, spacing: DSSpacing.lg) {
            ForEach(DSTextStyle.all, id: \.name) { style in
                VStack(alignment: .leading, spacing: DSSpacing.xs) {
                    Text(verbatim: "\(style.name) — \(style.specification)")
                        .dsText(.bodySmall1)
                        .foregroundStyle(.secondary)
                    Text(verbatim: "The quick brown fox jumps over the lazy dog")
                        .dsText(style)
                }
            }
        }
        .padding()
    }
}
