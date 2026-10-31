import SwiftUI

/// Loading placeholder for image blocks.
///
/// Native-first rule: for TEXT and whole layouts prefer the system
/// `.redacted(reason: .placeholder)` — it is free, matches the real layout and
/// respects accessibility. Use `DSSkeleton` only where redaction can't help
/// (image areas that don't exist yet).
struct DSSkeleton: View {
    var cornerRadius: CGFloat = DSRadius.sm

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(DSColor.fill)
            .dsShimmer()
            .accessibilityHidden(true)
    }
}

extension View {
    /// Sweeps a soft highlight across the view. Static under Reduce Motion.
    func dsShimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

private struct ShimmerModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: CGFloat = -1

    func body(content: Content) -> some View {
        content
            .overlay {
                if !reduceMotion {
                    GeometryReader { proxy in
                        LinearGradient(
                            colors: [.clear, Color.white.opacity(0.35), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: proxy.size.width * 0.6)
                        .offset(x: proxy.size.width * phase)
                    }
                    .allowsHitTesting(false)
                }
            }
            .clipped()
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 1.4
                }
            }
    }
}

#Preview {
    VStack(spacing: DSSpacing.lg) {
        DSSkeleton().aspectRatio(3.0 / 4.0, contentMode: .fit)
        Text("Redacted text uses the system placeholder")
            .redacted(reason: .placeholder)
    }
    .padding()
}
