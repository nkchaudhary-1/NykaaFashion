import SwiftUI

/// Profile. A `List` rather than a `ScrollView`, which also proves the top bar's
/// scroll interaction works on lists (`.collapsesTopNav()` accepts either).
/// The placeholder rows are only there to make the list long enough to scroll.
struct ProfileView: View {
    var body: some View {
        TabScreen(title: .heading("Profile")) {
            List {
                Section {
                    Text("Waiting for the design to be implemented.")
                        .foregroundStyle(DSColor.textSecondary)
                }

                #if DEBUG
                Section("Developer") {
                    NavigationLink("Component gallery") { ComponentGallery() }
                    DebugTypefaceRow()
                    DebugBagStepper()
                }
                #endif

                Section("Placeholder rows") {
                    ForEach(1...20, id: \.self) { index in
                        Text(verbatim: "Row \(index)")
                    }
                }
            }
            // Hide the list's own background so the screen's background shows
            // through — otherwise the gradient behind the top bar would not match it.
            .scrollContentBackground(.hidden)
            .collapsesTopNav()
        }
    }
}

#if DEBUG
/// On-screen proof the primary typeface loaded. A font that fails to register
/// doesn't error — the app just quietly shows the system font — so this says so.
private struct DebugTypefaceRow: View {
    var body: some View {
        let loaded = DSFontRegistry.loadedFaceCount
        let total = DSFontFace.allCases.count
        LabeledContent("Inter Display") {
            Text(verbatim: loaded == total
                 ? "✓ \(loaded) of \(total) weights loaded"
                 : "✗ \(loaded) of \(total) — showing system font")
        }
    }
}

/// Lets you see the Bag tab badge before a real bag exists.
private struct DebugBagStepper: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var appState = appState
        Stepper("Bag items: \(appState.bagCount)", value: $appState.bagCount, in: 0...99)
    }
}
#endif

#Preview {
    TabRoot(router: Router()) { ProfileView() }
        .environment(AppState())
}
