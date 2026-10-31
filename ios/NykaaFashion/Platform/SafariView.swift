import SwiftUI
import SafariServices

/// In-app browser (`SFSafariViewController`) for web content we don't own the UI
/// for — help pages, terms, a hosted payment/UPI fallback.
///
/// This is also the template for UIKit interop: a thin `UIViewControllerRepresentable`
/// per UIKit-only capability, kept in `Platform/`, so no UIKit leaks into features.
///
///     .fullScreenCover(isPresented: $showHelp) {
///         SafariView(url: helpURL).ignoresSafeArea()
///     }
struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
