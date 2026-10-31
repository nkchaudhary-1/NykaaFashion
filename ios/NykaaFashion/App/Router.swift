import SwiftUI
import Observation

/// Every pushable destination in the app, as a value. Typed routes keep
/// navigation testable and make deep links / universal links straightforward
/// later (a URL just maps to a `[Route]`).
///
/// PLACEHOLDER cases — grow this from the design's screen list.
enum Route: Hashable {
    case product(id: String)
    case category(id: String)
    case search(query: String)
}

/// One router per tab, so each tab keeps its own navigation history — the
/// behaviour iOS users expect from a tab bar.
///
/// Native `NavigationStack(path:)` underneath; this class only holds the path.
@Observable
final class Router {
    var path = NavigationPath()

    func push(_ route: Route) { path.append(route) }
    func popToRoot() { path = NavigationPath() }
}

/// Maps a `Route` to its screen. The only place that knows which view backs
/// which route.
struct RouteView: View {
    let route: Route

    var body: some View {
        switch route {
        case .product(let id):
            FeaturePlaceholder(title: "Product", detail: "id: \(id)")
        case .category(let id):
            FeaturePlaceholder(title: "Category", detail: "id: \(id)")
        case .search(let query):
            FeaturePlaceholder(title: "Search", detail: query.isEmpty ? nil : "query: \(query)")
        }
    }
}

/// Wraps a tab's root screen in its own `NavigationStack`.
///
/// The router is owned by the caller (`RootView`) rather than by this view, so
/// the tab bar can reset a tab's stack when its active tab is tapped again.
struct TabRoot<Content: View>: View {
    let router: Router
    private let content: Content

    init(router: Router, @ViewBuilder content: () -> Content) {
        self.router = router
        self.content = content()
    }

    var body: some View {
        @Bindable var router = router
        NavigationStack(path: $router.path) {
            content
                .navigationDestination(for: Route.self) { RouteView(route: $0) }
        }
        .environment(router)
    }
}
