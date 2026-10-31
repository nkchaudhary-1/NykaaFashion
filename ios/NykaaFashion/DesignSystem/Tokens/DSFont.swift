import SwiftUI

/// Type roles. Inter Display is the primary typeface.
///
/// Every role is `Font.custom(_:size:relativeTo:)`, which keeps the custom face
/// but still scales with Dynamic Type like the system text style it is tied to.
/// The base sizes equal that style's default size, so layout is unchanged from
/// the system defaults. Keep it that way: never use a fixed-size font here.
///
/// Weights are placeholders until the design specifies them. All faces are
/// listed in `DSFontFace` — if a face isn't registered the font silently falls
/// back to the system font, which `FontTests` is there to catch.
///
/// Native chrome (tab bar labels, pushed screens' back button and title) stays in
/// the system font on purpose: like the rest of the native bar, it isn't re-skinned.
enum DSFont {
    private static func inter(_ face: DSFontFace, size: CGFloat, relativeTo style: Font.TextStyle) -> Font {
        .custom(face.postScriptName, size: size, relativeTo: style)
    }

    static let display = inter(.light, size: 34, relativeTo: .largeTitle)
    static let title = inter(.semibold, size: 22, relativeTo: .title2)
    static let headline = inter(.semibold, size: 17, relativeTo: .headline)
    static let body = inter(.regular, size: 17, relativeTo: .body)
    static let callout = inter(.regular, size: 16, relativeTo: .callout)
    static let caption = inter(.regular, size: 12, relativeTo: .caption)
    /// Small uppercase labels. Pair with `.textCase(.uppercase)` and `.tracking(_:)`.
    static let eyebrow = inter(.semibold, size: 11, relativeTo: .caption2)

    /// Page title in the top bar, at rest and once the screen has scrolled.
    /// 28pt → 20pt at the default text size — the same 8pt shrink as One Moment's
    /// heading, and the same heights as the logo on Home, so every page's bar is
    /// the same size.
    static let heading = inter(.medium, size: 28, relativeTo: .title)
    static let headingCollapsed = inter(.medium, size: 20, relativeTo: .title3)

    /// Prices use tabular figures (Inter has `tnum`) so columns of prices line up.
    static let price = inter(.semibold, size: 16, relativeTo: .callout).monospacedDigit()
}
