import SwiftUI

/// Fixed-aspect image with loading and failure states.
///
/// Wraps the native `AsyncImage`. Known limit: AsyncImage only benefits from the
/// shared `URLCache` — no memory cache, no prefetching, no downsampling — so
/// long scrolling grids will re-decode and can stutter. That's an acceptable
/// foundation; swap the internals (Nuke / Kingfisher / a small custom loader)
/// once real catalogue images and scroll performance can be measured. Call sites
/// won't change.
///
/// Images are treated as decorative unless `accessibilityLabel` is given.
struct DSRemoteImage: View {
    let url: URL?
    var aspectRatio: CGFloat = 3.0 / 4.0
    var contentMode: ContentMode = .fill
    var accessibilityLabel: LocalizedStringKey? = nil

    var body: some View {
        // The clear base fixes the layout box so a `.fill` image can't overflow it.
        Color.clear
            .aspectRatio(aspectRatio, contentMode: .fit)
            .overlay { content }
            .clipped()
            .modifier(ImageAccessibility(label: accessibilityLabel))
    }

    @ViewBuilder
    private var content: some View {
        if let url {
            AsyncImage(url: url, transaction: Transaction(animation: DSMotion.quick)) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().aspectRatio(contentMode: contentMode)
                case .failure:
                    placeholder(systemName: "photo")
                default:
                    DSSkeleton(cornerRadius: 0)
                }
            }
        } else {
            placeholder(systemName: "photo")
        }
    }

    private func placeholder(systemName: String) -> some View {
        ZStack {
            DSColor.fill
            Image(systemName: systemName)
                .font(.title2)
                .foregroundStyle(DSColor.textTertiary)
        }
    }
}

private struct ImageAccessibility: ViewModifier {
    let label: LocalizedStringKey?

    func body(content: Content) -> some View {
        if let label {
            content.accessibilityLabel(label)
        } else {
            content.accessibilityHidden(true)
        }
    }
}

#Preview {
    HStack {
        DSRemoteImage(url: nil)
        DSRemoteImage(url: URL(string: "https://invalid.example/missing.jpg"))
    }
    .padding()
}
