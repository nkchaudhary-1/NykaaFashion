"use client";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressBlock } from "@/components/account/OrderParts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Overlay, OverlayBody, OverlayHeader } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { deleteAddress, setDefaultAddress, useAuth, type Address } from "@/stores/account";
import { toast } from "@/stores/ui";

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
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col justify-between gap-5 border border-line bg-paper p-6">
              <div>
                <div className="mb-3 flex items-center gap-2"><Badge tone="neutral" className="capitalize">{a.type}</Badge>{a.isDefault && <Badge tone="ink">Default</Badge>}</div>
                <AddressBlock a={a} />
              </div>
              <div className="flex flex-wrap items-center gap-1 border-t border-line pt-4">
                <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && <Button variant="ghost" size="sm" onClick={() => (setDefaultAddress(a.id), toast({ title: "Default address updated" }))}>Make default</Button>}
                {confirm === a.id ? (
                  <span className="ml-auto flex items-center gap-1" role="alert">
                    <span className="text-[12.5px] text-ink-2">Delete?</span>
                    <Button variant="danger" size="sm" onClick={() => (deleteAddress(a.id), setConfirm(null), toast({ title: "Address deleted" }))}>Delete</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>Keep</Button>
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" className="ml-auto text-danger" icon={<Trash2 size={13} />} onClick={() => setConfirm(a.id)}>Delete</Button>
                )}
              </div>
            </li>
          ))}
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
