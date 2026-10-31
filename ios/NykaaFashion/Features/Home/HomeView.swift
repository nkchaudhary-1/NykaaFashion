import SwiftUI

/// Home. The top bar (logo + search) is real; everything below it is
/// PLACEHOLDER content, there so the screen scrolls and the bar's behaviour can
/// be seen:
///   - the cards scroll UNDER the bar and dissolve into the background through
///     the soft gradient behind it (no hard edge)
///   - scroll down past 12pt → the logo shrinks 28 → 20pt and the gradient fades in
///   - scroll back to the top → the logo returns and the gradient fades out
///   - scrolling the "New in" row sideways does NOT affect the bar
///   - the bottom tab bar shrinks while scrolling down and returns scrolling up
///   - tap a product → pushed screen with its own native bar and back button
///
/// Replace the content with the designed home; keep the `TabScreen` and the
/// `.collapsesTopNav()` on whichever scroll view the screen uses.
struct HomeView: View {
    private let columns = [
        GridItem(.flexible(), spacing: DSSpacing.md),
        GridItem(.flexible()),
    ]

    var body: some View {
        TabScreen(title: .logo) {
            ScrollView {
                VStack(alignment: .leading, spacing: DSSpacing.xxl) {
                    bigCards
                    newInRail
                    pickedForYouGrid
                }
                .padding(.horizontal, DSSpacing.gutter)
                .padding(.bottom, DSSpacing.xl)
            }
            .collapsesTopNav()
        }
    }

    // MARK: Placeholder sections

    private var bigCards: some View {
        VStack(spacing: DSSpacing.lg) {
            ForEach(0..<4, id: \.self) { index in
                PlaceholderCard(index: index)
            }
        }
    }

    private var newInRail: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "New in")
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(alignment: .top, spacing: DSSpacing.md) {
                    ForEach(0..<8, id: \.self) { index in
                        productLink(Product.samples[index % Product.samples.count])
                            .frame(width: 160)
                    }
                }
            }
        }
    }

    private var pickedForYouGrid: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "Picked for you")
            LazyVGrid(columns: columns, spacing: DSSpacing.lg) {
                ForEach(0..<12, id: \.self) { index in
                    productLink(Product.samples[index % Product.samples.count])
                }
            }
        }
    }

    private func productLink(_ product: Product) -> some View {
        NavigationLink(value: Route.product(id: product.id)) {
            ProductCard(product: product)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    TabRoot(router: Router()) { HomeView() }
}
