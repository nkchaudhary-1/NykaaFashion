import SwiftUI

/// PLACEHOLDER content under the real top bar — see `PlaceholderCards.swift`.
struct WishlistView: View {
    var body: some View {
        TabScreen(title: .heading("Wishlist")) {
            ScrollView { PlaceholderFeed() }
                .collapsesTopNav()
        }
    }
}

#Preview {
    TabRoot(router: Router()) { WishlistView() }
}
