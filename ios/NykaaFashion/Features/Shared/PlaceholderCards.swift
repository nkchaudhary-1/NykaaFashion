import SwiftUI

/// PLACEHOLDER content for screens that aren't designed yet. It exists so every
/// page is long enough to scroll and the top bar's behaviour can be seen on it.
/// Delete usages as real screens land; delete this file when none remain.

/// A big tinted card. The tints are plain system colours so consecutive cards
/// are easy to tell apart while scrolling — they are NOT design tokens.
struct PlaceholderCard: View {
    let index: Int

    private let tones: [Color] = [.indigo, .teal, .orange, .pink, .mint, .purple]
    private let height: CGFloat = 240

    var body: some View {
        RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
            .fill(tones[index % tones.count].opacity(0.28))
            .frame(height: height)
            .overlay(alignment: .topLeading) {
                VStack(alignment: .leading, spacing: DSSpacing.xs) {
                    Text(verbatim: "\(index + 1)")
                        .dsText(.h1)
                        .foregroundStyle(DSColor.textPrimary)
                    Text(verbatim: caption)
                        .dsText(.bodyLarge2)
                        .foregroundStyle(DSColor.textSecondary)
                }
                .padding(DSSpacing.lg)
            }
            .accessibilityElement(children: .combine)
    }

    private var caption: String {
        index == 0
            ? "Scroll down: this fades out under the bar and the logo or title shrinks. Scroll back up: it returns."
            : "Placeholder card"
    }
}

/// A vertical stack of placeholder cards, padded like a real screen.
struct PlaceholderFeed: View {
    var count = 8

    var body: some View {
        VStack(spacing: DSSpacing.lg) {
            ForEach(0..<count, id: \.self) { index in
                PlaceholderCard(index: index)
            }
        }
        .padding(.horizontal, DSSpacing.gutter)
        .padding(.bottom, DSSpacing.xl)
    }
}
