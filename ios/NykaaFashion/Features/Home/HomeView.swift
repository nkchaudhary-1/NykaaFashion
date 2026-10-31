import SwiftUI

/// Home. The top bar is real; everything below it is PLACEHOLDER content, there
/// so the screen scrolls and the bar's behaviour can be seen:
///   - scroll down past 12pt → the logo shrinks 32 → 24pt
///   - scroll back to the top → it returns
///   - scrolling the "New in" row sideways does NOT affect the bar
///   - tap a product → pushed screen with its own native bar and back button
///
/// Replace the content with the designed home; keep the `TopNavScaffold` and the
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

/// A big tinted card. PLACEHOLDER ONLY: the tints are plain system colours so
/// consecutive cards are easy to tell apart while scrolling — they are not
/// design tokens and go away with this file's placeholder content.
private struct PlaceholderCard: View {
    let index: Int

    private let tones: [Color] = [.indigo, .teal, .orange, .pink, .mint, .purple]
    private let height: CGFloat = 240

    var body: some View {
        RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
            .fill(tones[index % tones.count].opacity(0.28))
            .frame(height: height)
            .overlay(alignment: .topLeading) {
                VStack(alignment: .leading, spacing: DSSpacing.xs) {
                    Text(verbatim: "\(index + 1)")
                        .font(DSFont.display)
                        .foregroundStyle(DSColor.textPrimary)
                    Text(verbatim: caption)
                        .font(DSFont.callout)
                        .foregroundStyle(DSColor.textSecondary)
                }
                .padding(DSSpacing.lg)
            }
            .accessibilityElement(children: .combine)
    }

    private var caption: String {
        index == 0
            ? "Scroll down: the logo shrinks. Scroll back up: it returns."
            : "Placeholder card"
    }
}

#Preview {
    TabRoot(router: Router()) { HomeView() }
}
