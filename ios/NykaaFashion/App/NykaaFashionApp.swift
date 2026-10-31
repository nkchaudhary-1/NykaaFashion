import SwiftUI

@main
struct NykaaFashionApp: App {
    init() {
        // Before any view is built: make sure Inter Display is available even if
        // the UIAppFonts plist route didn't take. See `DSFontRegistry`.
        DSFontRegistry.registerMissingFaces()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
