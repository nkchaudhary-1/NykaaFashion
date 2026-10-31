import XCTest
#if canImport(NykaaFashion)
@testable import NykaaFashion
#endif

final class PriceFormatterTests: XCTestCase {
    func testWholeRupeesDropDecimals() {
        XCTAssertEqual(PriceFormatter.string(1_299), "₹1,299")
    }

    func testUsesIndianDigitGrouping() {
        XCTAssertEqual(PriceFormatter.string(100_000), "₹1,00,000")
        XCTAssertEqual(PriceFormatter.string(12_34_567), "₹12,34,567")
    }

    func testPaiseKeepTwoDecimals() throws {
        let amount = try XCTUnwrap(Decimal(string: "1299.5"))
        XCTAssertEqual(PriceFormatter.string(amount), "₹1,299.50")
    }

    func testZero() {
        XCTAssertEqual(PriceFormatter.string(0), "₹0")
    }
}

final class EndpointTests: XCTestCase {
    private let base = URL(string: "https://api.example.com/v1")!

    func testBuildsURLWithPathAndQuery() throws {
        let endpoint = Endpoint(path: "products", query: [URLQueryItem(name: "q", value: "linen shirt")])
        let request = try endpoint.urlRequest(baseURL: base)
        XCTAssertEqual(request.url?.absoluteString, "https://api.example.com/v1/products?q=linen%20shirt")
        XCTAssertEqual(request.httpMethod, "GET")
    }

    func testLeadingSlashDoesNotDoubleUpSeparators() throws {
        let request = try Endpoint(path: "/products").urlRequest(baseURL: base)
        XCTAssertEqual(request.url?.absoluteString, "https://api.example.com/v1/products")
    }

    func testCarriesMethodHeadersAndBody() throws {
        let body = Data("{}".utf8)
        let endpoint = Endpoint(path: "bag", method: .post, headers: ["X-Test": "1"], body: body)
        let request = try endpoint.urlRequest(baseURL: base)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "X-Test"), "1")
        XCTAssertEqual(request.httpBody, body)
    }
}

final class ProductTests: XCTestCase {
    func testCodableRoundTrip() throws {
        let original = Product.samples[2]
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(Product.self, from: data)
        XCTAssertEqual(decoded, original)
    }
}
