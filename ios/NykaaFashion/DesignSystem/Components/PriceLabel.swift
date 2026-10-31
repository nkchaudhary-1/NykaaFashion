import SwiftUI

/// Selling price, plus the original price struck through — but only when the
/// original is actually higher. VoiceOver reads one clear sentence instead of
/// two fragments (a strikethrough is not announced by default).
struct PriceLabel: View {
    let price: Decimal
    var mrp: Decimal? = nil

    private var originalIfHigher: Decimal? {
        guard let mrp, mrp > price else { return nil }
        return mrp
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DSSpacing.sm) {
            Text(verbatim: PriceFormatter.string(price))
                .font(DSFont.price)
                .foregroundStyle(DSColor.textPrimary)
            if let original = originalIfHigher {
                Text(verbatim: PriceFormatter.string(original))
                    .font(DSFont.caption)
                    .strikethrough()
                    .foregroundStyle(DSColor.textSecondary)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: spokenLabel))
    }

    private var spokenLabel: String {
        var text = PriceFormatter.string(price)
        if let original = originalIfHigher {
            text += ", was " + PriceFormatter.string(original)
        }
        return text
    }
}

#Preview {
    VStack(alignment: .leading, spacing: DSSpacing.md) {
        PriceLabel(price: 1_499)
        PriceLabel(price: 1_499, mrp: 2_499)
        PriceLabel(price: 100_000, mrp: 125_000)
    }
    .padding()
}
