import SwiftUI

#if DEBUG
/// Debug-only catalogue of every token and component, rendered with the real
/// code — the place to compare the implementation against the design side by
/// side (try Dynamic Type, Dark Mode and Reduce Motion from Xcode's
/// Environment Overrides). Reachable from Profile → Developer in Debug builds;
/// stripped from Release.
struct ComponentGallery: View {
    @State private var selectedChip = "All"
    @State private var wishlisted: Set<String> = ["sample-1"]

    private struct Swatch: Identifiable {
        let name: String
        let color: Color
        var id: String { name }
    }

    private let colors: [Swatch] = [
        Swatch(name: "background", color: DSColor.background),
        Swatch(name: "backgroundSecondary", color: DSColor.backgroundSecondary),
        Swatch(name: "surface", color: DSColor.surface),
        Swatch(name: "fill", color: DSColor.fill),
        Swatch(name: "accent", color: DSColor.accent),
        Swatch(name: "textPrimary", color: DSColor.textPrimary),
        Swatch(name: "textSecondary", color: DSColor.textSecondary),
        Swatch(name: "separator", color: DSColor.separator),
        Swatch(name: "success", color: DSColor.success),
        Swatch(name: "warning", color: DSColor.warning),
        Swatch(name: "danger", color: DSColor.danger),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DSSpacing.xxl) {
                section("Colour") {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: DSSpacing.md)], spacing: DSSpacing.md) {
                        ForEach(colors) { item in
                            VStack(alignment: .leading, spacing: DSSpacing.xs) {
                                RoundedRectangle(cornerRadius: DSRadius.sm, style: .continuous)
                                    .fill(item.color)
                                    .frame(height: 44)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: DSRadius.sm, style: .continuous)
                                            .strokeBorder(DSColor.separator)
                                    )
                                Text(item.name).font(DSFont.caption).lineLimit(1)
                            }
                        }
                    }
                }

                section("Type") {
                    VStack(alignment: .leading, spacing: DSSpacing.sm) {
                        Text("Display").font(DSFont.display)
                        Text("Title").font(DSFont.title)
                        Text("Headline").font(DSFont.headline)
                        Text("Body — the quick brown fox jumps over the lazy dog").font(DSFont.body)
                        Text("Callout").font(DSFont.callout)
                        Text("Caption").font(DSFont.caption)
                        Text("Eyebrow").font(DSFont.eyebrow).tracking(0.6).textCase(.uppercase)
                        Text(verbatim: "₹1,299  ₹12,34,567").font(DSFont.price)
                    }
                }

                section("Buttons") {
                    VStack(alignment: .leading, spacing: DSSpacing.md) {
                        Button("Primary") {}.buttonStyle(.ds(.primary))
                        Button("Secondary") {}.buttonStyle(.ds(.secondary))
                        Button("Tertiary") {}.buttonStyle(.ds(.tertiary))
                        Button("Primary, full width") {}.buttonStyle(.ds(.primary, fullWidth: true))
                        Button("Disabled") {}.buttonStyle(.ds(.primary)).disabled(true)
                    }
                }

                section("Chips & badges") {
                    VStack(alignment: .leading, spacing: DSSpacing.md) {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(["All", "Dresses", "Shirts", "Bags"], id: \.self) { name in
                                    DSChip(title: LocalizedStringKey(name), isSelected: selectedChip == name) {
                                        selectedChip = name
                                    }
                                }
                            }
                        }
                        HStack {
                            DSBadge(text: "New")
                            DSBadge(text: "Accent", tone: .accent)
                            DSBadge(text: "Few left", tone: .warning)
                            DSBadge(text: "In stock", tone: .success)
                            DSBadge(text: "Sold out", tone: .danger)
                        }
                    }
                }

                section("Price") {
                    VStack(alignment: .leading, spacing: DSSpacing.sm) {
                        PriceLabel(price: 1_499)
                        PriceLabel(price: 1_499, mrp: 2_499)
                        PriceLabel(price: 12_999.50)
                    }
                }

                section("Product card") {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: DSSpacing.md), GridItem(.flexible())], spacing: DSSpacing.lg) {
                        ForEach(Product.samples) { product in
                            ProductCard(product: product, isWishlisted: wishlisted.contains(product.id)) {
                                if wishlisted.contains(product.id) {
                                    wishlisted.remove(product.id)
                                } else {
                                    wishlisted.insert(product.id)
                                }
                            }
                        }
                    }
                }

                section("Loading") {
                    HStack(spacing: DSSpacing.md) {
                        DSSkeleton().aspectRatio(3.0 / 4.0, contentMode: .fit)
                        DSSkeleton().aspectRatio(3.0 / 4.0, contentMode: .fit)
                    }
                    Text("Text and layouts: use .redacted(reason: .placeholder)")
                        .font(DSFont.callout)
                        .redacted(reason: .placeholder)
                }

                section("Section header") {
                    DSSectionHeader(title: "New in", actionTitle: "See all") {}
                }

                section("Empty state") {
                    DSEmptyState(
                        title: "Nothing saved yet",
                        message: "Tap the heart on anything you like and it will show up here.",
                        systemImage: "heart",
                        actionTitle: "Start browsing",
                        action: {}
                    )
                }
            }
            .padding(DSSpacing.gutter)
        }
        .background(DSColor.background)
        .navigationTitle("Component gallery")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            Text(verbatim: title)
                .font(DSFont.eyebrow)
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(DSColor.textSecondary)
                .accessibilityAddTraits(.isHeader)
            content()
        }
    }
}

#Preview {
    NavigationStack { ComponentGallery() }
}
#endif
