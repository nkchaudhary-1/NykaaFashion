import SwiftUI

/// Type roles. Every role is built on a system text style, so Dynamic Type
/// scales it automatically — keep it that way when swapping in custom fonts.
///
/// PLACEHOLDER VALUES — SF Pro, with a serif (New York) for display so the
/// hierarchy has some personality. When the design names its typefaces:
///   1. Bundle the font files and list them under `UIAppFonts`
///      (INFOPLIST_KEY / project.yml).
///   2. Replace the bodies below with
///      `Font.custom("FamilyName", size: 34, relativeTo: .largeTitle)`
///      so the custom font still scales with Dynamic Type.
enum DSFont {
    static let display = Font.system(.largeTitle, design: .serif, weight: .regular)
    static let title = Font.system(.title2, weight: .semibold)
    static let headline = Font.system(.headline)
    static let body = Font.system(.body)
    static let callout = Font.system(.callout)
    static let caption = Font.system(.caption)
    /// Small uppercase labels. Pair with `.textCase(.uppercase)` and `.tracking(_:)`.
    static let eyebrow = Font.system(.caption2, weight: .semibold)
    /// Page title in the top bar, at rest and once the screen has scrolled.
    /// Text styles, so they scale with Dynamic Type; at the default size they are
    /// 28pt → 20pt — the same 8pt shrink as One Moment's heading, and the same
    /// heights as the logo on Home, so every page's bar looks the same size.
    static let heading = Font.system(.title, design: .serif)
    static let headingCollapsed = Font.system(.title3, design: .serif)
    /// Prices use tabular figures so columns of prices line up.
    static let price = Font.system(.callout, weight: .semibold).monospacedDigit()
}
