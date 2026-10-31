import Foundation

/// The type scale: the 17 text styles on the Figma "Typography" token page
/// (file Mj8oos8GHlgEeY4fKgrJpY, node 6:2 → 10:105), with Figma's names.
///
/// Sizes, line heights and letter spacing are the exact values of the file's
/// typography variables (`font-size/…`, `line-height/…`, `letter-spacing/…`) —
/// the page's own labels round them ("40px" for a real 39.68). Plain data on
/// purpose, with no SwiftUI import, so the numbers are unit-tested.
///
/// DECIDED: the typeface is Inter Display. The Figma file disagrees with itself —
/// its labels say "Inter …" but its actual text layers are still Manrope — and
/// the labels are the intended spec, so this table uses them:
///   - face: Inter Display (not Manrope)
///   - weights as labelled: H1–H5 SemiBold (layers say Bold), Label Large/Small
///     SemiBold (layers say Medium)
/// Sizes, line heights and tracking agree between labels and layers. If the
/// weights should follow the layers instead, change each style's `face` here (and
/// bundle the Bold file) — nothing else moves. The Figma text styles themselves
/// still need switching to Inter Display so the file and the app agree.
///
/// Pairing guidance from the file: H1 hero · H2 section · H3 card/dashboard ·
/// H4 widget/compact · H5 label/micro.
struct DSTextStyle: Equatable {
    /// The Figma style name, e.g. "Heading H1 : 32".
    let name: String
    let face: DSFontFace
    /// Point size at the default Dynamic Type setting.
    let size: CGFloat
    /// Line height in points at the default Dynamic Type setting.
    let lineHeight: CGFloat
    /// Letter spacing in points (Figma "ls").
    let tracking: CGFloat
    /// Tabular (fixed-width) figures, for prices and other columns of numbers.
    var tabularFigures = false

    /// Extra spacing between lines that turns the font's natural line height
    /// into Figma's exact one. May be slightly negative for tight styles.
    var lineSpacingAdjustment: CGFloat {
        lineHeight - size * DSFontFace.naturalLineHeightRatio
    }

    /// This style with tabular figures on.
    func tabular() -> DSTextStyle {
        var copy = self
        copy.tabularFigures = true
        return copy
    }

    /// "SemiBold · 32 / 39.68 · ls -0.25" — the same shape as the Figma labels.
    var specification: String {
        "\(face.weightName) · \(Self.trimmed(size)) / \(Self.trimmed(lineHeight)) · ls \(Self.trimmed(tracking))"
    }

    private static func trimmed(_ value: CGFloat) -> String {
        String(format: "%g", Double(value))
    }
}

// MARK: - The 17 styles, in the order of the Figma page

extension DSTextStyle {
    // Headings
    static let h1 = DSTextStyle(name: "Heading H1 : 32", face: .semibold, size: 32, lineHeight: 39.68, tracking: -0.25)
    static let h2 = DSTextStyle(name: "Heading H2 : 24", face: .semibold, size: 24, lineHeight: 29.76, tracking: -0.25)
    static let h3 = DSTextStyle(name: "Heading H3 : 20", face: .semibold, size: 20, lineHeight: 24, tracking: -0.25)
    static let h4 = DSTextStyle(name: "Heading H4 : 16", face: .semibold, size: 16, lineHeight: 19.2, tracking: -0.2)
    static let h5 = DSTextStyle(name: "Heading H5 : 14", face: .semibold, size: 14, lineHeight: 15.68, tracking: -0.2)

    // Subtitles — Medium
    static let subtitleMed1 = DSTextStyle(name: "Subtitle MED 1 : 16", face: .medium, size: 16, lineHeight: 19.2, tracking: -0.25)
    static let subtitleMed2 = DSTextStyle(name: "Subtitle MED 2 : 14", face: .medium, size: 14, lineHeight: 16.8, tracking: -0.25)
    static let subtitleMed3 = DSTextStyle(name: "Subtitle MED 3 : 12", face: .medium, size: 12, lineHeight: 13.92, tracking: -0.25)

    // Subtitles — SemiBold
    static let subtitleSB1 = DSTextStyle(name: "Subtitle SB 1 : 16", face: .semibold, size: 16, lineHeight: 19.2, tracking: -0.25)
    static let subtitleSB2 = DSTextStyle(name: "Subtitle SB 2 : 14", face: .semibold, size: 14, lineHeight: 16.8, tracking: -0.25)
    static let subtitleSB3 = DSTextStyle(name: "Subtitle SB 3 : 12", face: .semibold, size: 12, lineHeight: 13.92, tracking: -0.25)

    // Body
    static let bodyLarge1 = DSTextStyle(name: "Body Large 1 : 16", face: .regular, size: 16, lineHeight: 22.4, tracking: -0.25)
    static let bodyLarge2 = DSTextStyle(name: "Body Large 2 : 14", face: .regular, size: 14, lineHeight: 19.6, tracking: -0.25)
    static let bodySmall1 = DSTextStyle(name: "Body Small 1 : 12", face: .regular, size: 12, lineHeight: 15.6, tracking: 0)
    static let bodySmall2 = DSTextStyle(name: "Body Small 2 : 10", face: .regular, size: 10, lineHeight: 13, tracking: 0)

    // Labels
    static let labelLarge = DSTextStyle(name: "Label Large", face: .semibold, size: 12, lineHeight: 15.6, tracking: 0)
    static let labelSmall = DSTextStyle(name: "Label Small", face: .semibold, size: 10, lineHeight: 13, tracking: 0)

    /// All 17, in the order of the Figma page — what the component gallery shows.
    static let all: [DSTextStyle] = [
        h1, h2, h3, h4,
        subtitleMed1, bodyLarge1, subtitleSB1,
        h5, subtitleMed2, bodyLarge2, subtitleSB2,
        subtitleMed3, bodySmall1, subtitleSB3,
        labelLarge, bodySmall2, labelSmall,
    ]
}
