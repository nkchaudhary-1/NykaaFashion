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
    Tokens/                  DSColor · DSTextStyle (17 Figma styles) · DSFontFace · DSSpacing/Radius/Size/Motion   ← design lands here
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

The type scale is the **17 text styles from the Figma Typography page**
([Nykaa Fashion New Look 2027, node 6:2](https://www.figma.com/design/Mj8oos8GHlgEeY4fKgrJpY/Nykaa-Fashion-New-Look-2027?node-id=6-2)),
named as in Figma, in `DSTextStyle`. Sizes, line heights and letter spacing are the **exact values of the file's
51 typography variables** — the page's own labels round them (they say "40px" for a real 39.68).

```swift
Text("Add to bag").dsText(.subtitleSB1)          // face + size + tracking + exact line height
Text("₹1,299").dsText(DSTextStyle.subtitleSB1.tabular())
```

| Style | Weight | Size / line height | Tracking | Style | Weight | Size / line height | Tracking |
|---|---|---|---|---|---|---|---|
| H1 · hero | SemiBold | 32 / 39.68 | −0.25 | Subtitle SB 1 | SemiBold | 16 / 19.2 | −0.25 |
| H2 · section | SemiBold | 24 / 29.76 | −0.25 | Subtitle SB 2 | SemiBold | 14 / 16.8 | −0.25 |
| H3 · card | SemiBold | 20 / 24 | −0.25 | Subtitle SB 3 | SemiBold | 12 / 13.92 | −0.25 |
| H4 · widget | SemiBold | 16 / 19.2 | −0.2 | Body Large 1 | Regular | 16 / 22.4 | −0.25 |
| H5 · label | SemiBold | 14 / 15.68 | −0.2 | Body Large 2 | Regular | 14 / 19.6 | −0.25 |
| Subtitle MED 1 | Medium | 16 / 19.2 | −0.25 | Body Small 1 | Regular | 12 / 15.6 | 0 |
| Subtitle MED 2 | Medium | 14 / 16.8 | −0.25 | Body Small 2 | Regular | 10 / 13 | 0 |
| Subtitle MED 3 | Medium | 12 / 13.92 | −0.25 | Label Large / Small | SemiBold | 12 / 15.6 · 10 / 13 | 0 |

(The component gallery renders all 17 with their specs, for side-by-side review. Pairing guide from the file:
H1 hero · H2 section · H3 card/dashboard · H4 widget/compact · H5 label/micro.)

### Open: the Figma file disagrees with itself on typeface and weights

| | The page's labels say | The actual text layers are |
|---|---|---|
| Typeface (all 17) | "Inter …" | **Manrope** |
| H1–H5 | Semi Bold | **Bold** |
| Label Large / Small | Semi Bold | **Medium** |

Sizes, line heights and tracking agree either way. `DSTextStyle` follows the **labels** — Inter Display, which is what
the app's primary typeface was specified as — so if the layers are the truth, only each style's `face` and the bundled
font files change. Needs a decision from the design owner.

### How it's built
- **Inter Display** (the optical-size cut of Inter 4.0, SIL OFL 1.1): Regular, Medium and SemiBold are bundled as
  byte-identical copies of the official release (`extras/ttf` in `Inter-4.0.zip`). They contain ₹ and tabular figures.
  Only weights the scale uses are bundled.
- **Dynamic Type:** `Font.custom(_:size:relativeTo:)` keeps the custom face and scales it; base sizes are Figma's, so layout
  matches the design at the default text size.
- **Line height:** SwiftUI can't set an exact one, so the style adds the difference between Figma's and the font's natural
  line height (1.21 × size, identical in every metrics table of the font) as `lineSpacing`, scaled with Dynamic Type.
  This governs **multi-line** text; a single line keeps the font's natural height, within ~1–2pt of Figma's box.
- **Letter spacing** is `.tracking`, in points as Figma's px. At ≤16pt Inter Display plus −0.25 tracking is tight —
  Inter's *text* cut is the one drawn for small sizes; worth a look on device.
- **Registration:** `Config/Info.plist` is a *partial* plist holding only `UIAppFonts`; Xcode merges it with the generated
  keys (`GENERATE_INFOPLIST_FILE`). `TabRoot` applies Body Large 1 as the default for unstyled text.
- **A wrong name never fails — it silently falls back to the system font.** `FontTests` (⌘U) checks each face is
  registered, is in the app bundle, has ₹, and that the 1.21 line-height constant matches the real font.
  `TextStyleTests` pin all 17 styles to the Figma numbers.
- Native chrome — tab bar labels, pushed screens' back button and title — stays in the system font on purpose, like
  the rest of the native bar.
- **Adding a weight:** the `.ttf` in `Resources/Fonts/`, its name in `Config/Info.plist`, a case in `DSFontFace`, a use in a style.
- **Licence:** the OFL requires its text to travel with the font; it's bundled as `Resources/Fonts/Inter-OFL.txt`. Add an
  acknowledgements entry before release.

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
