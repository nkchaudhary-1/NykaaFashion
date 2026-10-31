import SwiftUI

// The top navigation, on every tab's root screen: the Nykaa Fashion logo (Home)
// or the page name (other tabs) on the left, search on the right, and a soft
// gradient behind them that blends scrolled content into the background.
// Nothing else.
//
// Ported from One Moment's `rdl-redesign` branch (`MainTabView.TabRoot`),
// keeping its structure and behaviour:
//   - the bar is a `safeAreaBar` the screen scrolls UNDER, not a block above it
//   - `TopEdgeBlur` fades in behind it once the screen has scrolled, so content
//     dissolves into the background instead of meeting a hard edge
//   - `.scrollEdgeEffectStyle(.soft, for: .top)` lets the system's own edge
//     effect do the same for the scroll view
//   - the right-hand control is a native glass circle button that owns its own
//     metrics: no frame, no padding, `controlSize(.large)` is the only lever
//   - scrolling collapses the logo (28 → 20pt) or the page name (28 → 20pt at the
//     default text size), `.easeInOut(0.2)`, off under Reduce Motion
//   - the system navigation bar is hidden on the root screen only, so pushed
//     screens keep their own bar and back button

/// What the bar says on its left. Mirrors One Moment, where Today carries the
/// logo and every other tab carries its own name.
enum TopNavTitle {
    case logo
    case heading(LocalizedStringKey)
}

/// The row itself. Stateless: whoever owns the scroll state passes `isCollapsed`.
struct TopNavBar: View {
    var title: TopNavTitle = .logo
    var isCollapsed: Bool
    var onSearch: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(alignment: .center) {
            titleView

            Spacer()

            searchButton
        }
        .animation(reduceMotion ? nil : DSMotion.collapse, value: isCollapsed)
    }

    @ViewBuilder
    private var titleView: some View {
        switch title {
        case .logo:
            NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: isCollapsed))
        case .heading(let text):
            Text(text)
                .font(isCollapsed ? DSFont.headingCollapsed : DSFont.heading)
                .foregroundStyle(DSColor.textPrimary)
                .lineLimit(1)
                .accessibilityAddTraits(.isHeader)
        }
    }

    private var searchButton: some View {
        Button(action: onSearch) {
            // No frame and no padding: the button style owns its metrics.
            // `.imageScale(.large)` keeps the glyph in proportion to the circle.
            Image(systemName: "magnifyingglass")
                .imageScale(.large)
        }
        // Native Liquid Glass, exactly as One Moment's header buttons. Don't add
        // a background, stroke, shadow, clip or frame: glass draws its own.
        .buttonStyle(.glass)
        .buttonBorderShape(.circle)
        .controlSize(.large)
        .accessibilityLabel("Search")
    }
}

/// A screen with the top bar over it.
///
/// Owns the collapsed state, so each tab keeps its own — reading the preference
/// anywhere shared would collapse every tab at once. Wrap a tab's ROOT screen in
/// this; apply `.collapsesTopNav()` to that screen's `ScrollView`.
struct TopNavScaffold<Content: View>: View {
    var title: TopNavTitle
    var onSearch: () -> Void
    private let content: Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// True once the screen below has scrolled past the threshold. A screen with
    /// no scroll view never publishes, so this stays false: full-size logo, no blur.
    @State private var isCollapsed = false

    init(title: TopNavTitle = .logo, onSearch: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.title = title
        self.onSearch = onSearch
        self.content = content()
    }

    var body: some View {
        content
            // Order matters: the blur is added before the bar, so the bar and
            // its glass button draw on top of it.
            // At rest nothing is under the bar, so the blur stays out of the
            // way and only appears once the screen has scrolled.
            .overlay(alignment: .top) {
                TopEdgeBlur()
                    .opacity(isCollapsed ? 1 : 0)
                    .animation(reduceMotion ? nil : DSMotion.edgeBlur, value: isCollapsed)
            }
            .safeAreaBar(edge: .top, spacing: 0) {
                TopNavBar(title: title, isCollapsed: isCollapsed, onSearch: onSearch)
                    .padding(.horizontal, DSTopNav.horizontalPadding)
                    .padding(.top, DSTopNav.topPadding)
                    .padding(.bottom, DSTopNav.bottomPadding)
            }
            .scrollEdgeEffectStyle(.soft, for: .top)
            .background(DSColor.background.ignoresSafeArea())
            // The bar is content, so the 44pt system bar goes. Applied to the
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
                    RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
                        .fill(Color.orange.opacity(0.35))
                        .frame(height: 160)
                        .overlay { Text(verbatim: "Card \(index + 1)") }
                }
            }
            .padding(.horizontal, DSSpacing.gutter)
        }
        .collapsesTopNav()
    }
}
