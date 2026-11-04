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
export { DecartProvider } from "./providers/decart.ts";
export type {
  CameraService,
  ConnectOptions,
  Garment,
  SessionState,
  TryOnError,
  TryOnEvent,
  TryOnMode,
  TryOnProvider,
  TryOnSession,
} from "./types.ts";
