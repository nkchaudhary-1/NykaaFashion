import Foundation
import Observation

/// App-wide state that more than one tab needs to read.
///
/// PLACEHOLDER shape — `bagCount` becomes a value derived from the real bag
/// model once that exists. Injected once at the root:
///
///     @Environment(AppState.self) private var appState
@Observable
final class AppState {
    /// Number of items in the bag. Drives the Bag tab badge (hidden at 0).
    var bagCount = 0
}
