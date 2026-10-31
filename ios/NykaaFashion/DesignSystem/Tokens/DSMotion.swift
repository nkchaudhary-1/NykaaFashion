import SwiftUI

/// Motion. One spring for state changes, one quick ease for feedback.
/// Components that loop or travel must also respect
/// `@Environment(\.accessibilityReduceMotion)`. PLACEHOLDER VALUES.
enum DSMotion {
    static let standard = Animation.spring(duration: 0.35, bounce: 0.12)
    static let quick = Animation.easeOut(duration: 0.18)
    /// The top bar collapsing on scroll. Same curve and duration as One Moment's
    /// tab heading.
    static let collapse = Animation.easeInOut(duration: 0.2)
}
