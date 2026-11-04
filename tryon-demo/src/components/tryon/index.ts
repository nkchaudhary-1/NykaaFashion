// Public surface of the reusable try-on component.
//
//   import { TryOn, SimulationProvider, DecartProvider } from "@/components/tryon";
//   <TryOn ref={ref} garments={products} provider={provider} />   then   ref.current.tryOn(product.id)
//
// Nothing in this folder imports from the demo page or the demo's data.
export { TryOn } from "./TryOn";
export type { TryOnHandle, TryOnPanelState, TryOnProps } from "./TryOn";
export { TRYON_DRAG_TYPE, garmentDragProps } from "./drag.ts";
export { SimulationProvider } from "./providers/simulation.ts";
export { LocalPoseProvider } from "./providers/local/localPose.ts";
export { DecartProvider } from "./providers/decart.ts";
export { createPhotoRenderer, PhotoRenderError } from "./providers/photo/client.ts";
export type { PhotoRenderer, PhotoRenderResult, PhotoHealth, PhotoErrorKind } from "./providers/photo/client.ts";
export type {
  CameraService,
  ConnectOptions,
  Garment,
  GarmentAnchors,
  GarmentCategory,
  GarmentPart,
  GarmentParts,
  SessionState,
  TryOnError,
  TryOnEvent,
  TryOnMode,
  TryOnProvider,
  TryOnSession,
} from "./types.ts";
