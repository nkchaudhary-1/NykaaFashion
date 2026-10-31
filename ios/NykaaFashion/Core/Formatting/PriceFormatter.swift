import Foundation

/// Formats rupee amounts with Indian digit grouping (₹1,00,000, not ₹100,000).
///
/// Whole-rupee amounts drop the decimals ("₹1,299"); anything with paise keeps
/// two ("₹1,299.50").
///
/// The ₹ symbol is attached here rather than via `.currency(code: "INR")`
/// because the currency pattern comes from CLDR data that differs between OS
/// versions and platforms (we saw `₹ 1,299` with a space on one ICU build).
/// Whether a price has a gap after the symbol is a typographic call for the
/// design, so it's fixed in one place instead of depending on the OS.
/// Locale is fixed to en_IN on purpose: a device's region must not change how a
/// price reads.
enum PriceFormatter {
    static let symbol = "₹"
    static let locale = Locale(identifier: "en_IN")

    static func string(_ amount: Decimal) -> String {
        let digits = Decimal.FormatStyle(locale: locale)
            .precision(.fractionLength(isWhole(amount) ? 0 : 2))
        let sign = amount < 0 ? "-" : ""
        return sign + symbol + abs(amount).formatted(digits)
    }

    private static func isWhole(_ amount: Decimal) -> Bool {
        var source = amount
        var rounded = Decimal()
        NSDecimalRound(&rounded, &source, 0, .plain)
        return rounded == amount
    }
}
