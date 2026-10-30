"use client";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressBlock } from "@/components/account/OrderParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { deleteAddress, setDefaultAddress, useAuth, type Address } from "@/stores/account";
import { toast } from "@/stores/ui";

const act = "tap inline-flex h-10 items-center gap-1.5 px-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sand hover:text-ink [@media(pointer:coarse)]:h-11";

/** Addresses as cards on the content grid — 2-up on tablets (6 + 6 of 12), 3-up on desktop (3 + 3 + 3 of the 9 content columns). The default address is outlined in ink. */
export function AddressesView() {
  const { user, addresses } = useAuth();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!user) return null;
  const close = () => setEditing(null);
  return (
    <section aria-labelledby="ad-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="ad-h" className="display-sm">Saved addresses</h2>
        <Button icon={<Plus size={15} />} onClick={() => setEditing("new")}>Add address</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState visual={<MapPin size={40} strokeWidth={1} className="mx-auto text-ink-3" aria-hidden />} title="No saved addresses yet" text="Save an address now and checkout will be one step shorter." actions={<Button size="lg" onClick={() => setEditing("new")}>Add your first address</Button>} className="py-14" />
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((a) => (
            <li key={a.id} className={cn("flex flex-col justify-between gap-6 border bg-paper p-5 sm:p-6", a.isDefault ? "border-ink" : "border-line")}>
              <div>
                <div className="mb-4 flex items-center gap-2"><Badge tone="neutral" className="capitalize">{a.type}</Badge>{a.isDefault && <Badge tone="ink">Default</Badge>}</div>
                <AddressBlock a={a} />
              </div>
              {confirm === a.id ? (
                <div role="alert" className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="mr-auto text-[13px] text-ink-2">Delete this address?</span>
                  <Button variant="danger" size="sm" onClick={() => (deleteAddress(a.id), setConfirm(null), toast({ title: "Address deleted" }))}>Delete</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>Keep</Button>
                </div>
              ) : (
                <div className="-mx-2 flex flex-wrap items-center border-t border-line pt-3">
                  <button type="button" className={act} onClick={() => setEditing(a)}><Pencil size={14} aria-hidden /> Edit</button>
                  {!a.isDefault && <button type="button" className={act} onClick={() => (setDefaultAddress(a.id), toast({ title: "Default address updated" }))}>Make default</button>}
                  <button type="button" className={cn(act, "ml-auto hover:text-danger")} onClick={() => setConfirm(a.id)}><Trash2 size={14} aria-hidden /> Delete</button>
                </div>
              )}
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setEditing("new")} className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 border border-dashed border-line-strong p-6 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-paper">
              <Plus size={22} strokeWidth={1.4} aria-hidden /> Add a new address
            </button>
          </li>
        </ul>
      )}
      <Overlay open={editing !== null} onClose={close} label={editing === "new" ? "Add address" : "Edit address"} side="center" panelClassName="sm:w-[min(94vw,680px)] sm:max-h-[92dvh]">
        <OverlayHeader title={editing === "new" ? "Add address" : "Edit address"} />
        <OverlayBody>
          {editing && <AddressForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} defaults={{ name: user.name, mobile: user.mobile }} onSaved={() => (toast({ title: "Address saved" }), close())} onCancel={close} />}
        </OverlayBody>
      </Overlay>
    </section>
  );
}
