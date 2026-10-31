import Foundation

/// PLACEHOLDER model — just enough to build and preview components.
/// Replace with the real shape once the design and the API contract are known.
struct Product: Identifiable, Hashable, Codable {
    let id: String
    var title: String
    var brand: String
    var price: Decimal
    /// Original price. Only meaningful when greater than `price`.
    var mrp: Decimal?
    var imageURL: URL?
}

extension Product {
    /// Offline sample data for previews, the component gallery and tests.
    static let samples: [Product] = [
        Product(id: "sample-1", title: "Relaxed linen shirt", brand: "Sample Label", price: 1_499, mrp: 2_499, imageURL: nil),
        Product(id: "sample-2", title: "Hand-block printed cotton kurta with a very long name that wraps", brand: "Another Label", price: 3_200, mrp: nil, imageURL: nil),
        Product(id: "sample-3", title: "Leather tote", brand: "Sample Label", price: 12_999.50, mrp: nil, imageURL: nil),
        Product(id: "sample-4", title: "Silk scarf", brand: "Third Label", price: 100_000, mrp: 125_000, imageURL: nil),
    ]
}
