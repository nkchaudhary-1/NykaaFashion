import SwiftUI

struct HomeView: View {
    var body: some View {
        FeaturePlaceholder(title: "Home")
    }
}

#Preview {
    TabRoot(router: Router()) { HomeView() }
}
