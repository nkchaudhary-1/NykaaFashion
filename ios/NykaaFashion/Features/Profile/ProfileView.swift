import SwiftUI

struct ProfileView: View {
    var body: some View {
        List {
            Section {
                Text("Waiting for the design to be implemented.")
                    .foregroundStyle(DSColor.textSecondary)
            }

            #if DEBUG
            Section("Developer") {
                NavigationLink("Component gallery") { ComponentGallery() }
                DebugBagStepper()
            }
            #endif
        }
        .navigationTitle("Profile")
    }
}

#if DEBUG
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
