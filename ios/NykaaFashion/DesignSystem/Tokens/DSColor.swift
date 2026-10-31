import SwiftUI
import UIKit

/// Semantic colour tokens. Components read these, never literals.
///
/// PLACEHOLDER VALUES — these resolve to native system colours so the app looks
/// like a plain iOS app (and supports Dark Mode) until the design supplies a
/// palette. To adopt the design: change the values here (or point them at named
/// colours in Assets.xcassets). No component should need to change.
///
/// Contrast: re-verify every text/background pair against WCAG AA (4.5:1 body,
/// 3:1 large text) once the real palette lands.
enum DSColor {
    // MARK: Surfaces
    static let background = Color(.systemBackground)
    static let backgroundSecondary = Color(.secondarySystemBackground)
    /// Cards and grouped content.
    static let surface = Color(.secondarySystemGroupedBackground)
    /// Image placeholders, skeletons, chip fills.
    static let fill = Color(.secondarySystemFill)

    // MARK: Text
    static let textPrimary = Color.primary
    static let textSecondary = Color.secondary
    static let textTertiary = Color(.tertiaryLabel)
    /// Text/icons on top of `accent`.
    static let onAccent = Color(.systemBackground)

    // MARK: Brand
    /// Backed by AccentColor in Assets.xcassets, so native controls (links,
    /// toggles, tab selection) pick up the same tint.
    static let accent = Color.accentColor

    /// The Nykaa wordmark's ink. The supplied logo is a single-colour mark
    /// (white fill) rendered as a template, so this decides its colour. Light mode
    /// uses charcoal #222222 (the ink of the earlier logo file the design sent);
    /// dark mode uses white so the mark stays visible. PLACEHOLDER values until
    /// the design decides the header's colours.
    static let logo = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? .white
            : UIColor(red: 34.0 / 255, green: 34.0 / 255, blue: 34.0 / 255, alpha: 1)
    })

    // MARK: Lines
    static let separator = Color(.separator)
    static let separatorStrong = Color(.opaqueSeparator)

    // MARK: Status
    static let success = Color(.systemGreen)
    static let warning = Color(.systemOrange)
    static let danger = Color(.systemRed)
}
