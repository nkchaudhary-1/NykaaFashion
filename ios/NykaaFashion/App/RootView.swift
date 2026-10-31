import SwiftUI

/// App shell: the native `TabView`. Nav bars, tab bar, large titles, sheets and
/// search all stay system components on purpose — they carry accessibility,
/// gestures (swipe-back) and the OS's current visual language (e.g. Liquid Glass
/// on iOS 26 when built with the iOS 26 SDK) with zero custom code.
struct RootView: View {
    @State private var selection: AppTab = .home

    var body: some View {
        TabView(selection: $selection) {
            TabRoot { HomeView() }
                .tabItem { Label(AppTab.home.title, systemImage: AppTab.home.systemImage) }
                .tag(AppTab.home)

            TabRoot { CategoriesView() }
                .tabItem { Label(AppTab.categories.title, systemImage: AppTab.categories.systemImage) }
                .tag(AppTab.categories)

            TabRoot { WishlistView() }
                .tabItem { Label(AppTab.wishlist.title, systemImage: AppTab.wishlist.systemImage) }
                .tag(AppTab.wishlist)

            // When the bag has state, use the native tab badge: `.badge(count)`.
            TabRoot { BagView() }
                .tabItem { Label(AppTab.bag.title, systemImage: AppTab.bag.systemImage) }
                .tag(AppTab.bag)

            TabRoot { ProfileView() }
                .tabItem { Label(AppTab.profile.title, systemImage: AppTab.profile.systemImage) }
                .tag(AppTab.profile)
        }
    }
}

#Preview {
    RootView()
}
