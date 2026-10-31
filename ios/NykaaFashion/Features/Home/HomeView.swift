import SwiftUI

/// Home. The top bar is real; the content below it is PLACEHOLDER (a sample
/// grid, so the screen scrolls and the bar's collapse can be seen). Replace the
/// grid with the designed home content; keep the `TopNavScaffold` and the
/// `.collapsesTopNav()` on whichever scroll view the screen uses.
struct HomeView: View {
    @Environment(Router.self) private var router

    private let columns = [
        GridItem(.flexible(), spacing: DSSpacing.md),
        GridItem(.flexible()),
    ]

    var body: some View {
        TopNavScaffold(onSearch: { router.push(.search(query: "")) }) {
            ScrollView {
                LazyVGrid(columns: columns, spacing: DSSpacing.lg) {
                    ForEach(0..<12, id: \.self) { index in
                        let product = Product.samples[index % Product.samples.count]
                        NavigationLink(value: Route.product(id: product.id)) {
                            ProductCard(product: product)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, DSSpacing.gutter)
                .padding(.bottom, DSSpacing.xl)
            }
            .collapsesTopNav()
        }
    }
}

#Preview {
    TabRoot(router: Router()) { HomeView() }
}
