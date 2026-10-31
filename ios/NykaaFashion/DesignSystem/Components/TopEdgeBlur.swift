import SwiftUI

/// A soft blur that fades out downward from the top of the screen, so content
/// scrolling up is smoothed away over a generous stretch instead of ending at a
/// line. Sits under the top bar and never takes touches.
///
/// Ported from One Moment's `ComponentsTopEdgeBlur.swift`. The materials here
/// are a fade layer BEHIND the glass bar — never put one on a glass view itself.
struct TopEdgeBlur: View {
    var height: CGFloat = DSTopNav.blurHeight

    var body: some View {
        ZStack {
            // Two layers: the thick one gives the depth of the blur, the thin
            // one carries it further down so it fades out slowly.
            Rectangle()
                .fill(.regularMaterial)
                .mask(fade(peak: 1, reach: 0.7))

            Rectangle()
                .fill(.ultraThinMaterial)
                .mask(fade(peak: 1, reach: 1))

            // The tint that blends the blur into the screen's own background.
            LinearGradient(
                colors: [DSColor.background.opacity(0.6), .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        .frame(height: height)
        .ignoresSafeArea(edges: .top)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    /// Full strength at the top, easing to nothing at the bottom edge.
    private func fade(peak: Double, reach: Double) -> some View {
        LinearGradient(
            stops: [
                .init(color: .black.opacity(peak), location: 0),
                .init(color: .black.opacity(peak * 0.9), location: 0.4 * reach),
                .init(color: .black.opacity(peak * 0.4), location: 0.75 * reach),
                .init(color: .clear, location: reach),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

#Preview {
    ZStack(alignment: .top) {
        ScrollView {
            VStack(spacing: DSSpacing.lg) {
                ForEach(0..<20, id: \.self) { index in
                    RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
                        .fill(Color.orange.opacity(0.4))
                        .frame(height: 120)
                        .overlay { Text(verbatim: "Card \(index + 1)") }
                }
            }
            .padding()
        }
        TopEdgeBlur()
    }
}
