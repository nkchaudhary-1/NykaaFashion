import SwiftUI

/// Top-level tabs.
///
/// PLACEHOLDER — generic e-commerce structure. The design decides the real tab
/// set, names, order and icons; change this enum and `RootView` and nothing else.
/// (A native tab bar holds at most 5 before iOS collapses the rest into "More".)
enum AppTab: String, CaseIterable, Identifiable, Hashable {
    case home, categories, wishlist, bag, profile

    var id: String { rawValue }

    var title: LocalizedStringKey {
        switch self {
        case .home: "Home"
        case .categories: "Categories"
        case .wishlist: "Wishlist"
        case .bag: "Bag"
        case .profile: "Profile"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "house"
        case .categories: "square.grid.2x2"
        case .wishlist: "heart"
        case .bag: "bag"
        case .profile: "person"
        }
    }
}
