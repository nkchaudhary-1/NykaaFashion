import SwiftUI

/// App shell and bottom navigation: the native `TabView`.
///
/// Native on purpose. The system tab bar gives us accessibility (VoiceOver,
/// Dynamic Type, Voice Control), correct safe-area and keyboard behaviour, and
/// the OS's current look (Liquid Glass — this app targets iOS 26.2, same as One
/// Moment) — with no custom drawing. A hand-drawn bar loses all of that.
///
/// What we add on top, using only native hooks:
///   - SF Symbols fill automatically for the selected tab (system behaviour)
///   - a count badge on Bag (`.badge`, hidden at 0)
///   - a selection haptic (`.sensoryFeedback`)
///   - tapping the active tab again returns that tab to its root screen
///   - one `NavigationStack` per tab, so each tab keeps its own history
///
/// Tab set, names, order and icons live in `AppTab`; the design decides them.
struct RootView: View {
    @State private var selection: AppTab = .home
    @State private var appState = AppState()

    /// One router per tab. Built from `allCases`, so a lookup can't miss.
    @State private var routers: [AppTab: Router] = Dictionary(
        uniqueKeysWithValues: AppTab.allCases.map { ($0, Router()) }
    )

    var body: some View {
        TabView(selection: selectionBinding) {
            ForEach(AppTab.allCases) { tab in
                TabRoot(router: routers[tab]!) { screen(for: tab) } // safe: see `routers`
                    .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                    .tag(tab)
                    .badge(badgeCount(for: tab))
            }
        }
        .sensoryFeedback(.selection, trigger: selection)
        .environment(appState)
    }

    @ViewBuilder
    private func screen(for tab: AppTab) -> some View {
        switch tab {
        case .home: HomeView()
        case .categories: CategoriesView()
        case .wishlist: WishlistView()
        case .bag: BagView()
        case .profile: ProfileView()
        }
    }

    private func badgeCount(for tab: AppTab) -> Int {
        tab == .bag ? appState.bagCount : 0
    }

    /// Re-selecting the current tab pops it to its root, as iOS users expect.
    /// (Scroll-to-top on re-tap is a later step: each root screen has to opt in.)
    private var selectionBinding: Binding<AppTab> {
        Binding(
            get: { selection },
            set: { newTab in
                if newTab == selection { routers[newTab]?.popToRoot() }
                selection = newTab
            }
        )
    }
}

#Preview {
    RootView()
}
