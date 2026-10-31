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
            }
            #endif
        }
        .navigationTitle("Profile")
    }
}

#Preview {
    TabRoot { ProfileView() }
}
