import SwiftUI

/// Stand-in for a screen that hasn't been designed/implemented yet.
/// Delete usages as real screens land; delete this file when none remain.
struct FeaturePlaceholder: View {
    let title: LocalizedStringKey
    var detail: String? = nil

    var body: some View {
        DSEmptyState(
            title: title,
            message: LocalizedStringKey(detail ?? "Waiting for the design to be implemented."),
            systemImage: "square.dashed"
        )
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}
