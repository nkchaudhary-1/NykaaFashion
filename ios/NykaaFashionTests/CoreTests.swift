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

/// The top bar's numbers are ported from One Moment (`AppMetrics`); these pin
/// them so a casual edit can't silently make the two apps diverge.
final class TopNavTests: XCTestCase {
    func testSpacingMatchesOneMoment() {
        XCTAssertEqual(DSTopNav.horizontalPadding, 24) // spacingL
        XCTAssertEqual(DSTopNav.topPadding, 8)         // spacingXS
        XCTAssertEqual(DSTopNav.bottomPadding, 12)     // spacingS
    }

    func testLogoGoesFrom44To32PointsOnScroll() {
        XCTAssertEqual(DSTopNav.logoHeight(collapsed: false), 44)
        XCTAssertEqual(DSTopNav.logoHeight(collapsed: true), 32)
    }

    func testEdgeBlurReach() {
        XCTAssertEqual(DSTopNav.blurHeight, 230)
    }

    func testCollapsesOnlyStrictlyPastTheThreshold() {
        XCTAssertFalse(DSTopNav.isCollapsed(contentOffset: 0, topInset: 0))
        XCTAssertFalse(DSTopNav.isCollapsed(contentOffset: 12, topInset: 0))
        XCTAssertTrue(DSTopNav.isCollapsed(contentOffset: 12.5, topInset: 0))
    }

    func testRubberBandingAtTheTopDoesNotCollapse() {
        XCTAssertFalse(DSTopNav.isCollapsed(contentOffset: -80, topInset: 0))
    }

    func testTopInsetIsAddedBackBeforeComparing() {
        // At rest under a 59pt inset the offset is -59: not scrolled.
        XCTAssertFalse(DSTopNav.isCollapsed(contentOffset: -59, topInset: 59))
        XCTAssertTrue(DSTopNav.isCollapsed(contentOffset: -40, topInset: 59))
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
