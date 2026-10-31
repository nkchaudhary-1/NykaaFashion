import SwiftUI

struct BagView: View {
    var body: some View {
        FeaturePlaceholder(title: "Bag")
    }
}

#Preview {
    TabRoot(router: Router()) { BagView() }
}
