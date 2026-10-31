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

    func testLogoShrinksByEightPointsOnScroll() {
        XCTAssertEqual(DSTopNav.logoHeight(collapsed: false), 28)
        XCTAssertEqual(DSTopNav.logoHeight(collapsed: true), 20)
        // The 8pt shrink is One Moment's `headingShrink`.
        XCTAssertEqual(DSTopNav.restingLogoHeight - DSTopNav.collapsedLogoHeight, 8)
    }

    func testWordmarkStaysClearOfTheSearchButtonOnASmallPhone() {
        // Artwork aspect ratio 107.1 : 16. On a 375pt phone the bar has
        // 375 - 2*24 padding = 327pt; the glass button needs well under 80pt.
        let aspect: CGFloat = 107.1 / 16
        XCTAssertLessThan(DSTopNav.restingLogoHeight * aspect, 327 - 80)
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

final class FontFaceTests: XCTestCase {
    func testFileNameFollowsThePostScriptName() {
        for face in DSFontFace.allCases {
            XCTAssertEqual(face.fileName, face.postScriptName + ".ttf")
        }
    }

    func testFacesAreUniqueInterDisplayFonts() {
        let names = DSFontFace.allCases.map(\.postScriptName)
        XCTAssertEqual(Set(names).count, names.count)
        XCTAssertTrue(names.allSatisfy { $0.hasPrefix("InterDisplay-") })
    }
}

/// The 17 styles are copied from the Figma "Typography" page (node 10:105): the
/// real values of its `font-size/…`, `line-height/…` and `letter-spacing/…`
/// variables, not the rounded numbers in its labels. Pinned so a casual edit
/// can't silently drift from the design.
final class TextStyleTests: XCTestCase {
    private let figma: [(name: String, weight: String, size: CGFloat, lineHeight: CGFloat, tracking: CGFloat)] = [
        ("Heading H1 : 32", "SemiBold", 32, 39.68, -0.25),
        ("Heading H2 : 24", "SemiBold", 24, 29.76, -0.25),
        ("Heading H3 : 20", "SemiBold", 20, 24, -0.25),
        ("Heading H4 : 16", "SemiBold", 16, 19.2, -0.2),
        ("Heading H5 : 14", "SemiBold", 14, 15.68, -0.2),
        ("Subtitle MED 1 : 16", "Medium", 16, 19.2, -0.25),
        ("Subtitle MED 2 : 14", "Medium", 14, 16.8, -0.25),
        ("Subtitle MED 3 : 12", "Medium", 12, 13.92, -0.25),
        ("Subtitle SB 1 : 16", "SemiBold", 16, 19.2, -0.25),
        ("Subtitle SB 2 : 14", "SemiBold", 14, 16.8, -0.25),
        ("Subtitle SB 3 : 12", "SemiBold", 12, 13.92, -0.25),
        ("Body Large 1 : 16", "Regular", 16, 22.4, -0.25),
        ("Body Large 2 : 14", "Regular", 14, 19.6, -0.25),
        ("Body Small 1 : 12", "Regular", 12, 15.6, 0),
        ("Body Small 2 : 10", "Regular", 10, 13, 0),
        ("Label Large", "SemiBold", 12, 15.6, 0),
        ("Label Small", "SemiBold", 10, 13, 0),
    ]

    func testThereAreSeventeenStylesWithUniqueNames() {
        XCTAssertEqual(DSTextStyle.all.count, 17)
        XCTAssertEqual(Set(DSTextStyle.all.map(\.name)).count, 17)
    }

    func testEveryStyleMatchesTheFigmaValues() throws {
        for row in figma {
            let style = try XCTUnwrap(DSTextStyle.all.first { $0.name == row.name }, "\(row.name) is missing")
            XCTAssertEqual(style.face.weightName, row.weight, row.name)
            XCTAssertEqual(style.size, row.size, accuracy: 0.001, row.name)
            XCTAssertEqual(style.lineHeight, row.lineHeight, accuracy: 0.001, row.name)
            XCTAssertEqual(style.tracking, row.tracking, accuracy: 0.001, row.name)
        }
    }

    func testLineSpacingTurnsTheNaturalLineHeightIntoFigmasExactOne() {
        // Natural line height is 1.21 em: H1 = 32 * 1.21 = 38.72, Figma wants 39.68.
        XCTAssertEqual(DSTextStyle.h1.lineSpacingAdjustment, 0.96, accuracy: 0.001)
        XCTAssertEqual(DSTextStyle.bodyLarge1.lineSpacingAdjustment, 3.04, accuracy: 0.001)
        // A tight style asks for slightly LESS than natural.
        XCTAssertLessThan(DSTextStyle.h4.lineSpacingAdjustment, 0)
    }

    func testSpecificationReadsLikeTheFigmaLabel() {
        XCTAssertEqual(DSTextStyle.h1.specification, "SemiBold · 32 / 39.68 · ls -0.25")
        XCTAssertEqual(DSTextStyle.bodySmall1.specification, "Regular · 12 / 15.6 · ls 0")
    }

    func testTabularCopyChangesOnlyTheFlag() {
        let plain = DSTextStyle.subtitleSB1
        var expected = plain
        expected.tabularFigures = true
        XCTAssertEqual(plain.tabular(), expected)
        XCTAssertFalse(plain.tabularFigures)
    }

    func testPageTitleGoesH1ToH2LikeOneMomentsHeading() {
        XCTAssertEqual(DSTopNav.titleStyle(collapsed: false).size, 32)
        XCTAssertEqual(DSTopNav.titleStyle(collapsed: true).size, 24)
    }

    func testEveryStyleUsesABundledFace() {
        for style in DSTextStyle.all {
            XCTAssertTrue(DSFontFace.allCases.contains(style.face), style.name)
        }
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
