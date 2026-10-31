import SwiftUI

struct WishlistView: View {
    var body: some View {
        FeaturePlaceholder(title: "Wishlist")
    }
}

#Preview {
    TabRoot(router: Router()) { WishlistView() }
}
