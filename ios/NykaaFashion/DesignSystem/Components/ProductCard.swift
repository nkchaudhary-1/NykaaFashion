import SwiftUI

/// Grid/rail product card — a CUSTOM component built from native parts
/// (SF Symbols, `Button`, system haptics, symbol effects).
///
/// The card does not navigate by itself. Wrap it at the call site:
///
///     NavigationLink(value: Route.product(id: product.id)) {
///         ProductCard(product: product, isWishlisted: …, onToggleWishlist: …)
///     }
///     .buttonStyle(.plain)
///
/// PLACEHOLDER LAYOUT — rebuilt from the design when it arrives.
struct ProductCard: View {
    let product: Product
    var isWishlisted: Bool = false
    var onToggleWishlist: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            DSRemoteImage(url: product.imageURL)
                .clipShape(RoundedRectangle(cornerRadius: DSRadius.sm, style: .continuous))
                .overlay(alignment: .topTrailing) { wishlistButton }

            // One VoiceOver stop for the text block; the wishlist button stays separate.
            VStack(alignment: .leading, spacing: DSSpacing.xxs) {
                Text(product.brand)
                    .font(DSFont.caption)
                    .foregroundStyle(DSColor.textSecondary)
                    .lineLimit(1)
                Text(product.title)
                    .font(DSFont.callout)
                    .foregroundStyle(DSColor.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                PriceLabel(price: product.price, mrp: product.mrp)
                    .padding(.top, DSSpacing.xxs)
            }
            .accessibilityElement(children: .combine)
        }
    }

    private var wishlistButton: some View {
        Button(action: onToggleWishlist) {
            Image(systemName: isWishlisted ? "heart.fill" : "heart")
                .symbolEffect(.bounce, value: isWishlisted)
                .font(.body)
                .foregroundStyle(isWishlisted ? DSColor.accent : DSColor.textPrimary)
                .frame(width: DSSize.minTap, height: DSSize.minTap)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isWishlisted)
        .accessibilityLabel(
            isWishlisted
                ? LocalizedStringKey("Remove from wishlist")
                : LocalizedStringKey("Add to wishlist")
        )
    }
}

#Preview {
    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: DSSpacing.lg) {
        ForEach(Product.samples) { product in
            ProductCard(product: product, isWishlisted: product.id == "sample-1")
        }
    }
    .padding()
}
