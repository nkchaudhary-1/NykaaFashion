import Foundation

/// Metrics and logic for the home top bar.
///
/// Ported from One Moment's tab heading (`MainTabView.TabRoot.headerRow`,
/// `ScrollCollapse`, `AppMetrics`) so both apps behave the same. No SwiftUI
/// import on purpose: this is plain arithmetic, which keeps it unit-testable.
enum DSTopNav {

    // MARK: Spacing
    // One Moment's scale is named differently from this app's; the VALUES match.
    //   spacingL  = 24 → DSSpacing.xl
    //   spacingXS =  8 → DSSpacing.sm
    //   spacingS  = 12 → DSSpacing.md

    static let horizontalPadding = DSSpacing.xl
    static let topPadding = DSSpacing.sm
    static let bottomPadding = DSSpacing.md

    // MARK: Logo size

    /// Logo height at rest. One Moment's heading is 32pt.
    static let restingLogoHeight: CGFloat = 32

    /// Height the logo loses once the screen scrolls (`headingShrink`).
    static let logoShrink: CGFloat = 8

    static func logoHeight(collapsed: Bool) -> CGFloat {
        collapsed ? restingLogoHeight - logoShrink : restingLogoHeight
    }

    // MARK: Collapse

    /// How far a screen must scroll before the bar collapses
    /// (`headingCollapseOffset`). Enough to clear rubber-banding at the top, so
    /// the logo doesn't flicker when the list bounces.
    static let collapseOffset: CGFloat = 12

    /// `contentOffset.y` is negative while the content sits below a top inset
    /// (or is pulled past the top), so the inset is added back before comparing.
    /// Strictly greater: exactly at the threshold is still "not scrolled".
    static func isCollapsed(contentOffset: CGFloat, topInset: CGFloat) -> Bool {
        contentOffset + topInset > collapseOffset
    }
}
