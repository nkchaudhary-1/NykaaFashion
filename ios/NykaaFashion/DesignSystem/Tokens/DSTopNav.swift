import Foundation

/// Metrics and logic for the home top bar.
///
/// Ported from One Moment's `rdl-redesign` branch (`MainTabView.TabRoot`,
/// `ScrollCollapse`, `TopEdgeBlur`, `AppMetrics`) so both apps behave the same.
/// No SwiftUI import on purpose: this is plain arithmetic, which keeps it
/// unit-testable.
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
    // One Moment uses 44 → 32pt (`logoHeadingHeight` / `logoHeadingCollapsedHeight`),
    // but that is for its tall stacked mark (~145pt wide). The Nykaa Fashion
    // wordmark is 6.7 : 1, so 44pt tall would be ~295pt wide — nearly the whole
    // bar on a 393pt phone. Sized by width instead: 28pt (~187 wide) at rest,
    // 20pt (~134 wide) collapsed. The 8pt shrink matches One Moment's
    // `headingShrink`. A design call: tune these two numbers.

    static let restingLogoHeight: CGFloat = 28
    static let collapsedLogoHeight: CGFloat = 20

    static func logoHeight(collapsed: Bool) -> CGFloat {
        collapsed ? collapsedLogoHeight : restingLogoHeight
    }

    // MARK: Page title
    // On pages other than Home the bar carries the page name. At rest it is H1
    // (32pt) and collapses to H2 (24pt) — exactly One Moment's 32 → 24 heading.

    static func titleStyle(collapsed: Bool) -> DSTextStyle {
        collapsed ? .h2 : .h1
    }

    // MARK: Collapse

    /// How far a screen must scroll before the bar collapses
    /// (`headingCollapseOffset`). Enough to clear rubber-banding at the top, so
    /// the logo doesn't flicker when the list bounces.
    static let collapseOffset: CGFloat = 12

    /// `contentOffset.y` is negative while the content sits below a top inset
    /// (the bar itself is one), so the inset is added back before comparing.
    /// Strictly greater: exactly at the threshold is still "not scrolled".
    static func isCollapsed(contentOffset: CGFloat, topInset: CGFloat) -> Bool {
        contentOffset + topInset > collapseOffset
    }

    // MARK: Edge blur

    /// How far down the soft blur under the bar reaches, status bar included
    /// (`navBlurHeight`).
    static let blurHeight: CGFloat = 230
}
