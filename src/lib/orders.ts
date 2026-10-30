import type { Order, OrderItem, OrderStatus, PayMethod, Address } from "@/stores/account";
import type { ResolvedLine } from "@/stores/commerce";
import { DAY } from "./clock";
import type { Breakdown } from "./pricing";
import { labelById } from "@/data/labels";

export const STAGES: OrderStatus[] = ["created", "confirmed", "packed", "shipped", "delivered"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  created: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  "return-requested": "Return requested",
  refunded: "Refunded",
};

export const STATUS_NOTE: Record<OrderStatus, string> = {
  created: "We’ve received your (simulated) order.",
  confirmed: "The label has confirmed your order.",
  packed: "Packed and waiting for pickup.",
  shipped: "On its way to you.",
  delivered: "Delivered. We hope you love it.",
  cancelled: "This order was cancelled before shipping.",
  "return-requested": "Return requested — pickup will be scheduled.",
  refunded: "Refund processed to your original payment method (simulated).",
};

const OFFSET: Record<OrderStatus, number> = { created: 0, confirmed: 0.01, packed: 1, shipped: 2, delivered: 5, cancelled: 0, "return-requested": 0, refunded: 0 };

export function toOrderItems(lines: ResolvedLine[]): OrderItem[] {
  return lines.map((l) => ({
    productId: l.productId,
    variant: l.variant,
    size: l.size,
    qty: l.qty,
    price: l.product.price,
    mrp: l.product.mrp,
    name: l.product.name,
    label: labelById[l.product.labelId].name,
    image: l.variantData.images[0],
    color: l.variantData.colorName,
  }));
}

export interface BuildOrderInput {
  id: string;
  number: string;
  userId: string;
  placedAt: number;
  items: OrderItem[];
  address: Address;
  payment: Order["payment"];
  delivery: "standard" | "express";
  coupon: string | null;
  status: OrderStatus;
}

export function buildOrder(input: BuildOrderInput, pricing: Breakdown): Order {
  const stagesDone = STAGES.slice(0, Math.max(0, STAGES.indexOf(input.status)) + 1);
  const timeline = (input.status === "cancelled" ? ["created", "confirmed"] : stagesDone).map((s) => ({
    status: s as OrderStatus,
    at: input.placedAt + OFFSET[s as OrderStatus] * DAY,
    note: STATUS_NOTE[s as OrderStatus],
  }));
  if (input.status === "cancelled") timeline.push({ status: "cancelled", at: input.placedAt + 0.3 * DAY, note: STATUS_NOTE.cancelled });
  return {
    id: input.id,
    number: input.number,
    userId: input.userId,
    placedAt: input.placedAt,
    items: input.items,
    address: input.address,
    payment: input.payment,
    delivery: input.delivery,
    coupon: input.coupon,
    pricing,
    status: input.status,
    timeline,
    eta: input.placedAt + (input.delivery === "express" ? 3 : 5) * DAY,
    simulated: true,
  };
}

export function nextStatus(s: OrderStatus): OrderStatus | null {
  if (s === "return-requested") return "refunded";
  const i = STAGES.indexOf(s);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}
export const canCancel = (s: OrderStatus) => s === "created" || s === "confirmed" || s === "packed";
export const canReturn = (s: OrderStatus) => s === "delivered";

export function newOrderNumber(now: number): { id: string; number: string } {
  const n = String(now % 100000000).padStart(8, "0");
  return { id: `nf-${n}`, number: `NF-${n.slice(0, 4)}-${n.slice(4)}` };
}

export type { PayMethod };
