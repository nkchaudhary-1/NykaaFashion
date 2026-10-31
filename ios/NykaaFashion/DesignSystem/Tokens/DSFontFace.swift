import Foundation

/// The font files bundled with the app: Inter Display (SIL OFL 1.1), the
/// optical-size cut of Inter 4.0 designed for larger text.
///
/// The raw value is the font's PostScript name, which is what `Font.custom` and
/// `UIFont(name:)` look up. Use these names, never the file or family name — a
/// wrong name does not fail, it silently falls back to the system font.
///
/// Only the weights the type scale uses are bundled (see `DSTextStyle`).
/// Adding a weight takes four steps, all of which must agree:
///   1. add the .ttf to `NykaaFashion/Resources/Fonts/`
///   2. list the file in `Config/Info.plist` (`UIAppFonts`)
///   3. add a case here
///   4. use it from a `DSTextStyle`
/// `FontTests` (⌘U) fails if a case here isn't actually registered at runtime.
enum DSFontFace: String, CaseIterable {
    case regular = "InterDisplay-Regular"
    case medium = "InterDisplay-Medium"
    case semibold = "InterDisplay-SemiBold"

    var postScriptName: String { rawValue }

    /// The file's name in the bundle, as listed under `UIAppFonts`.
    var fileName: String { rawValue + ".ttf" }

    /// The weight's name as the type scale documents it.
    var weightName: String {
        switch self {
        case .regular: "Regular"
        case .medium: "Medium"
        case .semibold: "SemiBold"
        }
    }

    /// Natural line height as a multiple of the font size: (ascender − descender
    /// + line gap) / units-per-em = (1984 + 494 + 0) / 2048. Identical in the
    /// hhea, typo and win tables of every Inter Display weight, so there is no
    /// ambiguity about which one the system reads. SwiftUI can't set an exact
    /// line height, so `DSTextStyle` adds the difference as line spacing.
    /// `FontTests` checks this against the real `UIFont`.
    static let naturalLineHeightRatio: CGFloat = 1.21
}
