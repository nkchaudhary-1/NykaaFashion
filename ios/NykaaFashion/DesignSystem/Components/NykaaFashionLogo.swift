import SwiftUI

/// The Nykaa wordmark, drawn at a given height.
///
/// Source: the supplied `Logo.svg` (the "NYKAA FASHION" wordmark), stored as the
/// `NykaaFashionLogo` image set. Only the root element's width/viewBox was
/// trimmed (108 → 107.1, removing ~0.9 units of right-hand padding so the mark
/// sits flush on the bar's 24pt margin); all eight paths are byte-identical.
///
/// The file is white-filled. It is rendered as a template and tinted with
/// `DSColor.logo`, so it reads on both light and dark backgrounds — a white mark
/// used as-is would vanish on a light screen. Same technique as One Moment's
/// wordmark.
///
/// The logo deliberately does not scale with Dynamic Type: it is a fixed brand
/// mark, not reading text, and it carries an accessibility label.
struct NykaaFashionLogo: View {
    /// Rendered height in points. The top bar shrinks this on scroll; the width
    /// follows from the artwork's 6.7 : 1 aspect ratio.
    var height: CGFloat

    var body: some View {
        Image("NykaaFashionLogo")
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            .foregroundStyle(DSColor.logo)
            .frame(height: height)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Nykaa Fashion")
            .accessibilityAddTraits(.isHeader)
    }
}

#Preview {
    VStack(alignment: .leading, spacing: DSSpacing.lg) {
        NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: false))
        NykaaFashionLogo(height: DSTopNav.logoHeight(collapsed: true))
    }
    .padding()
}
