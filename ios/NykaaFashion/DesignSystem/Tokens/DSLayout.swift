import SwiftUI

/// 4pt spacing scale. PLACEHOLDER VALUES — replace from the design's spacing tokens.
enum DSSpacing {
    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48
    /// Default horizontal screen margin.
    static let gutter: CGFloat = 16
}

/// Corner radii. For pills use `Capsule()`. PLACEHOLDER VALUES.
enum DSRadius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    static let lg: CGFloat = 16
}

/// Sizes that are accessibility requirements rather than style.
enum DSSize {
    /// Apple HIG minimum hit target.
    static let minTap: CGFloat = 44
}

/// Motion. One spring for state changes, one quick ease for feedback.
/// Components that loop or travel must also respect
/// `@Environment(\.accessibilityReduceMotion)`. PLACEHOLDER VALUES.
enum DSMotion {
    static let standard = Animation.spring(duration: 0.35, bounce: 0.12)
    static let quick = Animation.easeOut(duration: 0.18)
}
