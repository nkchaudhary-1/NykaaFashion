# Nykaa Fashion — iOS

Native SwiftUI app. **Status: foundation only.** The app shell, design-system layer and
core utilities exist; every screen is a placeholder until the design is provided.
This folder is self-contained and independent of the web prototype in the repo root
(no shared tokens, data or images) — it can be moved to its own repo unchanged.

## Run it (on a Mac with Xcode 26.2+)

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

The bottom bar is the native `TabView` (`App/RootView.swift`), declared with the
`Tab(value:content:label:)` API exactly as One Moment does. Tabs are defined in
`App/AppTab.swift` — title, SF Symbol, order — and are placeholders until the design
sets them. Native hooks add: `.tabBarMinimizeBehavior(.onScrollDown)` (the bar shrinks as a
page scrolls down and returns scrolling up — each page's scroll view drives it), a count badge
on Bag (`AppState.bagCount`), a selection haptic, filled icons for the selected tab (automatic),
one `NavigationStack` per tab so each keeps its history, and tapping the active tab again pops
it to its root. In a Debug build, Profile → Developer → "Bag items" lets you see the badge.

Why native rather than a hand-drawn bar: accessibility, safe areas, keyboard handling and
the iOS 26 Liquid Glass look come free, and a custom bar re-implements all of it. The
trade-off is limited styling: tint, labels and icons are easy; a floating pill, an
elevated centre button or a fully custom shape would need a custom bar (hide the system
one and draw ours), which I'd only do if the design requires it. (One Moment's tabs are
icon-only; these show labels — a one-line change, `.labelStyle(.iconOnly)`.)

## Top navigation (every page)

Logo (Home) or page name (every other tab) on the left, search on the right, and a soft
gradient behind them that blends scrolled content into the background. Nothing else. It is a port of One Moment's top bar
from its **`rdl-redesign` branch** (not `main`, which still has the older block-above-content
header) — same structure, metrics and behaviour — so the two apps feel identical:

| | One Moment source | Here |
|---|---|---|
| Bar is a `safeAreaBar` the screen scrolls **under**; system nav bar hidden on the root only | `MainTabView.TabRoot` | `TopNavScaffold` |
| Soft blur + background-colour gradient behind the bar, fading in only once scrolled | `ComponentsTopEdgeBlur.swift`, `.scrollEdgeEffectStyle(.soft, for: .top)` | `TopEdgeBlur`, same modifier |
| Row, glass circle button (`.glass` / `.circle` / `.large`, no frame or padding) | `headerRow`, `profileButton` | `TopNavBar` |
| Collapse on scroll via a Bool `PreferenceKey` | `ComponentsScrollCollapse.swift` | `ScrollCollapse.swift` |
| Numbers: padding 24/8/12, logo 28 → 20pt (see below), threshold 12pt, blur reach 230pt, 0.2s bar / 0.25s blur ease-in-out, off under Reduce Motion | `AppMetrics` | `DSTopNav` (pinned by tests) |

Every tab root uses the same wrapper, so the interaction is identical on all pages:

```swift
TabScreen(title: .logo) {                       // Home
TabScreen(title: .heading("Wishlist")) {        // any other tab
    ScrollView { … }.collapsesTopNav()          // or a List — whichever drives the bar
}
```

`TabScreen` (Features/Shared) is the only place that joins the bar to the app: search
pushes `Route.search` onto the current tab's stack. The page-name heading is 28 → 20pt at
the default text size (text styles, so it scales with Dynamic Type) — the same 8pt shrink as
the logo, so every page's bar is the same size. Search appears on every page, which is an
assumption: One Moment shows its profile button on every tab the same way.
Categories, Wishlist, Bag and Profile currently hold placeholder cards/rows
(`Features/Shared/PlaceholderCards.swift`) so each page is long enough to scroll.

Adaptations from One Moment:
- **Logo is your supplied `Logo.svg`** ("NYKAA FASHION"), as the `NykaaFashionLogo` image set. Only the root `width`/`viewBox` was trimmed (~0.9% right padding); all 8 paths are byte-identical. The file is white-filled, so it is a template tinted with `DSColor.logo` (charcoal `#222222` in light mode, white in dark) — as-is it would vanish on a light screen. **Size is not One Moment's 44 → 32pt**: that is for its tall stacked mark; this wordmark is 6.7 : 1, so 44pt tall would be ~295pt wide, nearly the whole bar. It is 28 → 20pt (~187 → ~134pt wide) with the same 8pt shrink; tune in `DSTopNav`.
- **One glass button, not two.** One Moment's Today bar has camera + profile sharing a
  `GlassEffectContainer`; Nykaa has only search, so no container.
- **Search icon is an SF Symbol.** One Moment's icons are custom Iconsax SVGs; export
  `search-normal` from the icon library as `ic-search` and swap the one `Image(systemName:)`.
- **Background.** The blur tints with `DSColor.background` (system background), so it
  blends in light and dark. One Moment is dark-only; this app follows the system until the
  design decides.

## Typography

**Inter Display is the primary typeface** (the optical-size cut of Inter 4.0, SIL Open Font
License 1.1). Four weights are bundled — Light, Regular, Medium, SemiBold (~1.6 MB) — as
byte-identical copies of the official release (`extras/ttf` in `Inter-4.0.zip`). They contain
the ₹ glyph and tabular figures, which the price label uses.

- Roles live in `DSFont` (display, heading, title, headline, body, callout, caption, eyebrow, price).
  Each is `Font.custom(_:size:relativeTo:)`, so it keeps Inter Display **and** scales with Dynamic
  Type; base sizes equal the system defaults, so layout didn't move. Weights are placeholders until
  the design specifies them.
- Registration: `Config/Info.plist` is a *partial* plist holding only `UIAppFonts`; Xcode merges it with
  the generated keys (`GENERATE_INFOPLIST_FILE`). `TabRoot` sets `DSFont.body` as the default for any
  unstyled text (list rows, steppers).
- **A wrong name never fails — it silently falls back to the system font.** So `FontTests` (⌘U) checks each
  face is registered, is in the app bundle, and has ₹. If the text looks like SF, run it first.
- Native chrome — tab bar labels, pushed screens' back button and title — stays in the system font on
  purpose, like the rest of the native bar. Re-skinning it is possible (`UITabBarItem` appearance) but
  I'd only do it if the design requires it.
- **Adding a weight** takes four agreeing steps: the `.ttf` in `Resources/Fonts/`, its filename in
  `Config/Info.plist`, a case in `DSFontFace`, and a use in `DSFont`.
- **Licence:** the OFL requires its text to travel with the font; it's bundled as
  `Resources/Fonts/Inter-OFL.txt`. Add an acknowledgements entry before release.
- Not applied yet: One Moment's moodboard uses −0.25 tracking on Inter Display; add it per role once the
  design confirms it. Whether a secondary face (an accent/serif) is planned is an open question — today
  every role is Inter Display.

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
- **iOS 26.2 minimum — the same as One Moment.** Native Liquid Glass (`.glass`), `onScrollGeometryChange` and the current `Tab`/tab-bar APIs are used directly, with no availability fallbacks. Cost: iPhones that can't run iOS 26 are not supported. It is a one-line change in `project.yml` (`deploymentTarget`), but lowering it means re-adding gates.
- **XcodeGen instead of a committed `.xcodeproj`.** The spec is readable and diffs cleanly; a hand-edited `.pbxproj` is neither. Cost: one extra tool. To commit the project instead, generate once and drop `*.xcodeproj` from `.gitignore`.
- **Swift 5 language mode.** Swift 6 strict concurrency is a deliberate later migration, not something to fight on day one.
- **iPhone only, portrait only** for v1. iPad is a later phase.
- **Placeholder colours; real typeface.** Colours are system colours (so the app gets Dark Mode for free) until the design supplies a palette; the typeface is Inter Display. All values live in `DesignSystem/Tokens`; placeholders are labelled.
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
