import SwiftUI
import UIKit

/// The Nykaa Fashion logo, drawn at a given height.
///
/// TO USE THE REAL LOGO: add the official file to Assets.xcassets as an image
/// set named `NykaaFashionLogo` (a vector PDF or SVG with "Preserve Vector
/// Data" ticked, rendering "Original" so brand colours survive). This view
/// picks it up automatically — no code change.
///
/// Until then it draws a PLACEHOLDER text wordmark. It is not the brand logo.
///
/// The logo deliberately does not scale with Dynamic Type: a logo is a fixed
/// brand mark, not reading text, and it already has an accessibility label.
struct NykaaFashionLogo: View {
    static let assetName = "NykaaFashionLogo"

    /// Rendered height in points. The top bar shrinks this on scroll.
    var height: CGFloat

    var body: some View {
        mark
            .frame(height: height)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Nykaa Fashion")
            .accessibilityAddTraits(.isHeader)
    }

    @ViewBuilder
    private var mark: some View {
        if UIImage(named: Self.assetName) != nil {
            Image(Self.assetName)
                .resizable()
                .scaledToFit()
        } else {
            // PLACEHOLDER — sized from the height so it collapses like the real mark would.
            Text(verbatim: "Nykaa Fashion")
                .font(.system(size: height * 0.75, weight: .regular, design: .serif))
                .foregroundStyle(DSColor.textPrimary)
                .lineLimit(1)
                .fixedSize()
        }
    }
}

#Preview {
    VStack(alignment: .leading, spacing: DSSpacing.lg) {
        NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: false))
        NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: true))
    }
    .padding()
}
