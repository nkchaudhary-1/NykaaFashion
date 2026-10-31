import SwiftUI

// The home top navigation: Nykaa Fashion logo on the left, search on the right.
// Nothing else.
//
// Ported from One Moment's `MainTabView.TabRoot` (`headerRow` + `profileButton`),
// keeping its structure and behaviour:
//   - the bar is CONTENT above the screen, not a toolbar; the system navigation
//     bar is hidden on the root screen only, so pushed screens keep their own
//     bar and back button
//   - the right-hand control is a native glass circle button that owns its own
//     metrics: no frame, no padding, `controlSize(.large)` is the only lever
//   - scrolling the screen below collapses the logo by `DSTopNav.logoShrink`
//   - `.easeInOut(0.2)`, switched off under Reduce Motion
//   - a screen without a scroll view never publishes, so its bar never collapses

/// The row itself. Stateless: whoever owns the scroll state passes `isCollapsed`.
struct TopNavBar: View {
    var isCollapsed: Bool
    var onSearch: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(alignment: .center) {
            NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: isCollapsed))

            Spacer()

            searchButton
        }
        .animation(reduceMotion ? nil : DSMotion.collapse, value: isCollapsed)
    }

    private var searchButton: some View {
        Button(action: onSearch) {
            // No frame and no padding: the button style owns its metrics.
            // `.imageScale(.large)` keeps the glyph in proportion to the circle.
            Image(systemName: "magnifyingglass")
                .imageScale(.large)
        }
        // Native Liquid Glass, exactly as One Moment's profile button. Don't add
        // a background, stroke, shadow, clip or frame: glass draws its own.
        .buttonStyle(.glass)
        .buttonBorderShape(.circle)
        .controlSize(.large)
        .accessibilityLabel("Search")
    }
}

/// A screen with the top bar above it.
///
/// Owns the collapsed state, so each tab keeps its own — reading the preference
/// anywhere shared would collapse every tab at once. Wrap a tab's ROOT screen in
/// this; apply `.collapsesTopNav()` to that screen's `ScrollView`.
struct TopNavScaffold<Content: View>: View {
    var onSearch: () -> Void
    private let content: Content

    /// True once the screen below has scrolled past the threshold.
    @State private var isCollapsed = false

    init(onSearch: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.onSearch = onSearch
        self.content = content()
    }

    var body: some View {
        VStack(spacing: 0) {
            TopNavBar(isCollapsed: isCollapsed, onSearch: onSearch)
                .padding(.horizontal, DSTopNav.horizontalPadding)
                .padding(.top, DSTopNav.topPadding)
                .padding(.bottom, DSTopNav.bottomPadding)

            content
        }
        // The logo row is content, so the 44pt system bar goes. Applied to the
        // root only: pushed screens keep their own bar and back button.
        .toolbar(.hidden, for: .navigationBar)
        .onPreferenceChange(ScrollCollapseKey.self) { scrolled in
            isCollapsed = scrolled
        }
    }
}

#Preview {
    TopNavScaffold(onSearch: {}) {
        ScrollView {
            LazyVStack(spacing: DSSpacing.lg) {
                ForEach(0..<30, id: \.self) { index in
                    Text("Row \(index)")
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(DSColor.fill, in: RoundedRectangle(cornerRadius: DSRadius.md))
                }
            }
            .padding(.horizontal, DSSpacing.gutter)
        }
        .collapsesTopNav()
    }
}
