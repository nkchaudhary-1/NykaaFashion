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

    func testInfoPlistListsEveryFace() {
        // Checks the merged Info.plist itself. The launch-time fallback in
        // DSFontRegistry would otherwise hide a plist that didn't merge.
        let listed = Bundle(for: AppState.self).object(forInfoDictionaryKey: "UIAppFonts") as? [String] ?? []
        for face in DSFontFace.allCases {
            XCTAssertTrue(
                listed.contains(face.fileName),
                "\(face.fileName) is not in UIAppFonts of the built app. Config/Info.plist did not merge — check INFOPLIST_FILE in project.yml."
            )
        }
    }

    func testRegisteringMissingFacesLeavesEveryFaceLoadable() {
        DSFontRegistry.registerMissingFaces()
        XCTAssertEqual(DSFontRegistry.loadedFaceCount, DSFontFace.allCases.count)
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

    func testNaturalLineHeightMatchesTheConstantBehindTheLineSpacing() throws {
        // DSTextStyle derives its extra line spacing from this ratio; if it were
        // wrong every multi-line style would drift from Figma's line height.
        for face in DSFontFace.allCases {
            let font = try XCTUnwrap(UIFont(name: face.postScriptName, size: 100))
            XCTAssertEqual(font.lineHeight, 100 * DSFontFace.naturalLineHeightRatio, accuracy: 1.0, face.postScriptName)
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
