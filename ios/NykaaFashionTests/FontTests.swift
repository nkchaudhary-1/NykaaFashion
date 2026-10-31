import XCTest
import UIKit
import CoreText
@testable import NykaaFashion

/// Runs in Xcode (⌘U) against the real app bundle. `Font.custom` never fails —
/// a misspelt name or an unregistered file just falls back to the system font —
/// so this is the only thing that tells you the primary typeface isn't loading.
final class FontTests: XCTestCase {
    func testEveryFaceIsRegisteredWithTheSystem() {
        for face in DSFontFace.allCases {
            XCTAssertNotNil(
                UIFont(name: face.postScriptName, size: 17),
                "\(face.postScriptName) is not registered. Check the file is in Resources/Fonts, is listed under UIAppFonts in Config/Info.plist, and that the PostScript name is exact."
            )
        }
    }

    func testEveryFaceIsInTheAppBundle() {
        // A class from the APP module, so this resolves to the app bundle (a class
        // declared in this test file would resolve to the test bundle).
        let appBundle = Bundle(for: AppState.self)
        for face in DSFontFace.allCases {
            XCTAssertNotNil(
                appBundle.url(forResource: face.rawValue, withExtension: "ttf"),
                "\(face.fileName) is not in the app bundle"
            )
        }
    }

    func testRupeeSignIsInThePrimaryFace() throws {
        // Prices are rendered in this face; a font without ₹ would show a fallback glyph.
        let font = try XCTUnwrap(UIFont(name: DSFontFace.semibold.postScriptName, size: 17))
        var characters: [UniChar] = [0x20B9] // ₹
        var glyphs: [CGGlyph] = [0]
        XCTAssertTrue(
            CTFontGetGlyphsForCharacters(font as CTFont, &characters, &glyphs, 1),
            "₹ (U+20B9) is missing from \(font.fontName)"
        )
    }
}
