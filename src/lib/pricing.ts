import { COD_FEE, EXPRESS_SHIPPING, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING, couponByCode } from "@/data/commerce";
import { labelById } from "@/data/labels";
import type { Coupon, Product } from "@/data/types";
import { inr } from "./format";

export interface PricedLine {
  product: Product;
  qty: number;
}

export interface Breakdown {
  itemCount: number;
  mrpTotal: number;
  subtotal: number;
  productDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null;
  shipping: number;
  codFee: number;
  total: number;
  youSave: number;
  freeShippingRemaining: number;
}

export type PayOpts = { coupon?: string | null; delivery?: "standard" | "express"; cod?: boolean };

export function evaluateCoupon(code: string, lines: PricedLine[]): { ok: true; discount: number; coupon: Coupon } | { ok: false; reason: string } {
  const coupon = couponByCode[code.trim().toUpperCase()];
  if (!coupon) return { ok: false, reason: "That code isn’t valid. Try one of the offers below." };
  if (coupon.expired) return { ok: false, reason: "This offer has expired." };
  const eligible = lines.filter((l) => !coupon.appliesTo || labelById[l.product.labelId].flags[coupon.appliesTo]).reduce((n, l) => n + l.product.price * l.qty, 0);
  if (coupon.appliesTo && eligible === 0) return { ok: false, reason: `No items in your bag are eligible for ${coupon.code}.` };
  if (eligible < coupon.minSubtotal) return { ok: false, reason: `Add ${inr(coupon.minSubtotal - eligible)} more${coupon.appliesTo ? " of eligible items" : ""} to use ${coupon.code}.` };
  const raw = coupon.type === "percent" ? Math.floor((eligible * coupon.value) / 100) : Math.min(coupon.value, eligible);
  return { ok: true, discount: coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw, coupon };
}

export function priceBag(lines: PricedLine[], opts: PayOpts = {}): Breakdown {
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const mrpTotal = lines.reduce((n, l) => n + l.product.mrp * l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  let couponDiscount = 0;
  let couponError: string | null = null;
  if (opts.coupon) {
    const r = evaluateCoupon(opts.coupon, lines);
    if (r.ok) couponDiscount = r.discount;
    else couponError = r.reason;
  }
  const afterCoupon = subtotal - couponDiscount;
  const express = opts.delivery === "express";
  const shipping = itemCount === 0 ? 0 : express ? EXPRESS_SHIPPING : afterCoupon >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const codFee = opts.cod && itemCount > 0 ? COD_FEE : 0;
  const total = afterCoupon + shipping + codFee;
  return {
    itemCount,
    mrpTotal,
    subtotal,
    productDiscount: mrpTotal - subtotal,
    couponCode: opts.coupon && !couponError ? opts.coupon : null,
    couponDiscount,
    couponError,
    shipping,
    codFee,
    total,
    youSave: mrpTotal - subtotal + couponDiscount,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - afterCoupon),
  };
}
