import Foundation
import os

/// Unified logging (`os.Logger`) — shows in Console.app and Xcode's log pane,
/// with privacy redaction by default. One category per area; add more as needed.
///
///     Log.network.error("Request failed: \(error.localizedDescription, privacy: .public)")
enum Log {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "NykaaFashion"

    static let app = Logger(subsystem: subsystem, category: "app")
    static let network = Logger(subsystem: subsystem, category: "network")
    static let ui = Logger(subsystem: subsystem, category: "ui")
}
