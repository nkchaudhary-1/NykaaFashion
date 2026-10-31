import Foundation

/// The font files bundled with the app: Inter Display (SIL OFL 1.1), the
/// optical-size cut of Inter 4.0 designed for larger text.
///
/// The raw value is the font's PostScript name, which is what `Font.custom` and
/// `UIFont(name:)` look up. Use these names, never the file or family name — a
/// wrong name does not fail, it silently falls back to the system font.
///
/// Adding a weight takes four steps, all of which must agree:
///   1. add the .ttf to `NykaaFashion/Resources/Fonts/`
///   2. list the file in `Config/Info.plist` (`UIAppFonts`)
///   3. add a case here
///   4. use it in `DSFont`
/// `FontTests` (⌘U) fails if a case here isn't actually registered at runtime.
enum DSFontFace: String, CaseIterable {
    case light = "InterDisplay-Light"
    case regular = "InterDisplay-Regular"
    case medium = "InterDisplay-Medium"
    case semibold = "InterDisplay-SemiBold"

    var postScriptName: String { rawValue }

    /// The file's name in the bundle, as listed under `UIAppFonts`.
    var fileName: String { rawValue + ".ttf" }
}
