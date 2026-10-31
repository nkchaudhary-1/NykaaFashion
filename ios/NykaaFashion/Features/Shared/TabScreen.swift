import SwiftUI

/// A tab's root screen with the top bar on it — the one place every page gets
/// the same bar, the same scroll interaction and the same search action.
///
///     TabScreen(title: .heading("Wishlist")) {
///         ScrollView { … }
///             .collapsesTopNav()   // on the scroll view (or List) that drives the bar
///     }
///
/// Home passes `.logo`; every other tab passes its own name, as in One Moment.
/// Search pushes `Route.search` onto the CURRENT tab's stack, so back returns to
/// the page it came from. This is the only place that connects the design-system
/// bar to the app's router.
struct TabScreen<Content: View>: View {
    var title: TopNavTitle
    private let content: Content

    @Environment(Router.self) private var router

    init(title: TopNavTitle, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        TopNavScaffold(title: title, onSearch: { router.push(.search(query: "")) }) {
            content
        }
    }
}
