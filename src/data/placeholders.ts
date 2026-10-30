// Model photography placeholders: two studio photographs cut into every ratio the layouts use
// (scripts/placeholders/build.mjs). Files are ordinary image keys under public/img/placeholders/, so
//   <Img imgKey={photo("kurta-set", "3x4")} alt="" sizes={…} ratio="3/4" />
// works anywhere. Swap a file for a real photograph with the same name and nothing else changes.
export type PhotoSubject = "kurta-set" | "boucle-suit";
export type PhotoRatio = "3x4" | "4x5" | "1x1" | "16x9" | "16x9-copy-left" | "9x16" | "3x2";

export const photo = (subject: PhotoSubject, ratio: PhotoRatio) => `placeholders/${subject}-${ratio}`;

/** The ratio each kind of slot wants. 3:4 is the default portrait. */
export const PHOTO_SLOT = {
  /** full-bleed desktop banner: subject on the right, headline on the calm left wall */
  hero: "16x9-copy-left",
  /** phones and tablets: image above, copy in a flat panel below */
  heroSmall: "4x5",
  /** category, edit and story cards */
  card: "3x4",
  /** product-style cards and bento tiles */
  productCard: "4x5",
  /** square tiles, avatars of a collection, social crops */
  tile: "1x1",
  /** wide banners and split sections where the subject stays centred */
  banner: "16x9",
  /** stories, vertical promos, full-height mobile panels */
  story: "9x16",
} as const satisfies Record<string, PhotoRatio>;
