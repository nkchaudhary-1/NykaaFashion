import SwiftUI

/// PLACEHOLDER content under the real top bar — see `PlaceholderCards.swift`.
struct CategoriesView: View {
    var body: some View {
        TabScreen(title: .heading("Categories")) {
            ScrollView { PlaceholderFeed() }
                .collapsesTopNav()
        }
    }
}

#Preview {
    TabRoot(router: Router()) { CategoriesView() }
}
