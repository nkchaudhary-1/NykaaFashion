import CoreText
import Foundation
import UIKit

/// Makes sure the bundled typeface is actually available.
///
/// The normal route is `UIAppFonts` in `Config/Info.plist`, merged into the app's
/// Info.plist by Xcode. That can fail without any error — the app just shows the
/// system font and looks unchanged — so at launch this registers any bundled face
/// the system doesn't already know, straight from the app bundle. Registering a
/// face that is already known is skipped, so with a working plist this does nothing.
enum DSFontRegistry {

    /// Registers every bundled face the system can't yet load. Returns the faces it
    /// had to register (empty when the plist route worked).
    @discardableResult
    static func registerMissingFaces(in bundle: Bundle = .main) -> [DSFontFace] {
        var registered: [DSFontFace] = []

        for face in DSFontFace.allCases where !isLoaded(face) {
            guard let url = bundle.url(forResource: face.rawValue, withExtension: "ttf") else {
                Log.ui.error("Font file missing from the bundle: \(face.fileName, privacy: .public)")
                continue
            }

            var error: Unmanaged<CFError>?
            if CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error) {
                registered.append(face)
            } else {
                let reason = error.map { CFErrorCopyDescription($0.takeRetainedValue()) as String } ?? "unknown"
                Log.ui.error("Could not register \(face.fileName, privacy: .public): \(reason, privacy: .public)")
            }
        }

        if !registered.isEmpty {
            Log.ui.warning("UIAppFonts did not register the fonts; registered \(registered.count) at launch instead. Check Config/Info.plist is merged into the build.")
        }
        return registered
    }

    static func isLoaded(_ face: DSFontFace) -> Bool {
        UIFont(name: face.postScriptName, size: 12) != nil
    }

    /// How many of the bundled faces the system can load right now.
    static var loadedFaceCount: Int {
        DSFontFace.allCases.filter(isLoaded).count
    }
}
