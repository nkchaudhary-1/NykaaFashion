# Nykaa Fashion — iOS

Native SwiftUI app. **Status: foundation only.** The app shell, design-system layer and
core utilities exist; every screen is a placeholder until the design is provided.
This folder is self-contained and independent of the web prototype in the repo root
(no shared tokens, data or images) — it can be moved to its own repo unchanged.

## Run it (on a Mac with Xcode 15+)

```bash
./ios/scripts/setup-xcode.sh   # checks Xcode, installs XcodeGen, generates the project, opens it
```

Or by hand: `brew install xcodegen && cd ios && xcodegen generate && open NykaaFashion.xcodeproj`.
Xcode itself comes from the Mac App Store (needs your Apple ID) — the script tells you if it's missing.

Then set your Team and bundle ID (`project.yml` → `DEVELOPMENT_TEAM`,
`PRODUCT_BUNDLE_IDENTIFIER`, both marked `TODO`) and run on an iPhone simulator.
In a Debug build open **Profile → Developer → Component gallery**. ⌘U runs the tests.

## Structure

```
project.yml                  XcodeGen spec (the .xcodeproj is generated + git-ignored)
NykaaFashion/
  App/                       entry point, native TabView shell, typed routes + per-tab router
  DesignSystem/
    Tokens/                  DSColor · DSFont · DSSpacing/Radius/Size/Motion   ← design lands here
    Components/              DS* base components, PriceLabel, ProductCard
    Gallery/                 debug-only catalogue of every token + component
  Features/                  one folder per tab/flow (placeholders today)
  Core/                      Models · Formatting · Networking (APIClient) · Logging — no UI imports
  Platform/                  thin UIKit wrappers (SafariView) so UIKit never leaks into features
  Resources/                 Assets.xcassets (AppIcon, AccentColor)
NykaaFashionTests/
```

Dependencies point one way: `Features → DesignSystem → Core`, `App → everything`.
Tokens are the only thing components read for colour, type, spacing and motion.

## Bottom navigation

The bottom bar is the native `TabView` (`App/RootView.swift`). Tabs are defined in
`App/AppTab.swift` — title, SF Symbol, order — and are placeholders until the design
sets them. Native hooks add: a count badge on Bag (`AppState.bagCount`), a selection
haptic, filled icons for the selected tab (automatic), one `NavigationStack` per tab so
each keeps its history, and tapping the active tab again pops it to its root. In a Debug
build, Profile → Developer → "Bag items" lets you see the badge.

Why native rather than a hand-drawn bar: accessibility, safe areas, keyboard handling and
the iOS 26 Liquid Glass look come free, and a custom bar re-implements all of it. The
trade-off is limited styling: tint, labels and icons are easy; a floating pill, an
elevated centre button or a fully custom shape would need a custom bar (hide the system
one and draw ours), which I'd only do if the design requires it.

## Native vs custom

| Native (don't rebuild) | Custom (design-owned) |
|---|---|
| Tab bar, nav bar, large titles, swipe-back | Product card, price, badges, chips |
| Sheets + detents, menus, alerts, share sheet | Editorial / hero layouts |
| Search field, text fields, pickers, toggles | Brand moments, empty-state art |
| `ContentUnavailableView`, `.redacted`, `AsyncImage` | Button *style* (on a native `Button`) |
| SF Symbols, haptics (`.sensoryFeedback`), Dynamic Type | Motion curves |

Rule: **restyle native controls through styles and tokens; build custom views only for
brand-expressive surfaces.** Native chrome keeps accessibility, gestures and the OS's
current look (including Liquid Glass on iOS 26 when built with the iOS 26 SDK) for free.
Don't fake glass or blur in custom components.

## Native frameworks

| Framework | Used for | Status |
|---|---|---|
| SwiftUI | all UI | imported |
| UIKit | `UIColor` bridging in tokens; interop wrappers in `Platform/` | imported |
| SafariServices | in-app browser (`SafariView`) | wrapper ready, not yet used |
| Observation | `@Observable` router/state | imported |
| Foundation / URLSession | `APIClient`, formatting | imported |
| os | `Log` (unified logging) | imported |
| XCTest | unit tests | imported |
| AuthenticationServices, UserNotifications, PhotosUI, AVKit, SwiftData/Keychain, WidgetKit, StoreKit, MapKit | sign-in, push, photo upload, video, persistence, widgets, review prompt, store/pincode | **add when a designed feature needs them** — importing unused frameworks adds nothing |

## Decisions and trade-offs

- **SwiftUI-first, UIKit only via `Platform/`.** Faster to build and preview, native by default. Cost: a few things (zoomable image gallery, some scroll-perf cases) will need UIKit wrappers later.
- **iOS 17 minimum.** Gives `@Observable`, `NavigationStack`, `ContentUnavailableView`, `.sensoryFeedback`, SwiftData, symbol effects. Keeps older iPhones covered. Raising to 18/26 later is a one-line change in `project.yml`.
- **XcodeGen instead of a committed `.xcodeproj`.** The spec is readable and diffs cleanly; a hand-edited `.pbxproj` is neither. Cost: one extra tool. To commit the project instead, generate once and drop `*.xcodeproj` from `.gitignore`.
- **Swift 5 language mode.** Swift 6 strict concurrency is a deliberate later migration, not something to fight on day one.
- **iPhone only, portrait only** for v1. iPad is a later phase.
- **Placeholder tokens use system colours and SF Pro/New York.** The app looks like plain iOS (and gets Dark Mode) until the design says otherwise. All values live in `DesignSystem/Tokens`; every placeholder is labelled.
- **Prices are formatted by us, not by `.currency(code:)`.** Digits use fixed `en_IN` grouping (₹1,00,000); the ₹ is attached in `PriceFormatter`. The currency pattern comes from CLDR data that varies by OS version — Linux ICU produced `₹ 1,299` — and the gap after ₹ is a typographic decision for the design.
- **`AsyncImage` for now.** It only uses the shared `URLCache` (no memory cache or prefetching). Fine for a foundation; swap the internals of `DSRemoteImage` once real images and scroll performance can be measured.

## What has and hasn't been verified

Built in a Linux sandbox with no Xcode, so **the app has not been compiled or run.**

- ✅ `Core` (price formatting, endpoint building, `Product` Codable) compiled and **8/8 tests pass** on Swift 6.1.2 / Linux. Number grouping on Apple platforms should match; confirm with ⌘U.
- ✅ All 28 Swift files pass `swiftc -parse` (syntax only). `project.yml` and the asset JSON are valid.
- ❌ **Not verified:** SwiftUI type-checking and API usage, the generated Xcode project, previews, and anything visual. Expect a small number of compile or layout fixes on the first Xcode build — report them and they're quick to fix. A macOS CI job (`xcodegen generate && xcodebuild test`) would catch these on every push.

## Scope

**Done (foundation):** project spec, app shell with per-tab navigation, tokens, base components (button, chip, badge, skeleton, image, empty state, section header, price, product card), component gallery, API client, logging, tests.

**Next — needs the design:** real tab structure, token values and fonts (bundle them and map via `Font.custom(_, size:, relativeTo:)` so Dynamic Type still works), screen layouts, rebuilding `ProductCard` and friends to match, the real data model and API contract.

**Later phases:** persistence (wishlist/bag), auth, push, deep links, iPad, localisation, Swift 6 migration, CI, analytics.
