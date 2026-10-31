import SwiftUI

/// PLACEHOLDER content under the real top bar — see `PlaceholderCards.swift`.
struct BagView: View {
    var body: some View {
        TabScreen(title: .heading("Bag")) {
            ScrollView { PlaceholderFeed() }
                .collapsesTopNav()
        }
    }
}

#Preview {
    TabRoot(router: Router()) { BagView() }
}
