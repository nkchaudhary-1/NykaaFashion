import SwiftUI

// Lets a screen's scroll view tell the top bar it has moved.
//
// Ported from One Moment's `ComponentsScrollCollapse.swift`.
//
// The bar lives in `TopNavScaffold`, above the screen; the scroll view lives
// inside it. A preference is the one direction data travels for free — child to
// ancestor — so the scroll view publishes and the bar reads.
//
// What travels is a Bool, not an offset. Publishing the offset would redraw the
// bar on every scrolled pixel; the threshold is evaluated inside the scroll
// geometry closure, so the action fires only twice per scroll — crossing down,
// crossing back.

struct ScrollCollapseKey: PreferenceKey {
    /// A screen with no scroll view publishes nothing, so the default stands
    /// and its bar never collapses.
    static let defaultValue = false

    static func reduce(value: inout Bool, nextValue: () -> Bool) {
        value = value || nextValue()
    }
}

private struct ScrollCollapseReporter: ViewModifier {
    @State private var isScrolled = false

    func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content
                .onScrollGeometryChange(for: Bool.self) { geometry in
                    DSTopNav.isCollapsed(
                        contentOffset: geometry.contentOffset.y,
                        topInset: geometry.contentInsets.top
                    )
                } action: { _, scrolled in
                    isScrolled = scrolled
                }
                .preference(key: ScrollCollapseKey.self, value: isScrolled)
        } else {
            // iOS 17 has no scroll-geometry hook, so the bar stays full size.
            // (Raising the deployment target to iOS 18+ removes this branch.)
            content
        }
    }
}

extension View {
    /// Apply to a `ScrollView` or `List` whose screen should collapse the top
    /// bar as it scrolls.
    func collapsesTopNav() -> some View {
        modifier(ScrollCollapseReporter())
    }
}
