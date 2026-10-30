"use client";
import { FlaskConical } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { setUI } from "@/stores/ui";

/** Opens the prototype controls drawer. `variant` lets it sit on a dark band (e.g. "inverse"). */
export function OpenPrototypeButton({ variant, size, className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  return (
    <Button variant={variant} size={size} className={className} icon={<FlaskConical size={15} />} onClick={() => setUI({ protoOpen: true })} aria-haspopup="dialog">
      Open prototype controls
    </Button>
  );
}
