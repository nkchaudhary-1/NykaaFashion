"use client";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { setUI } from "@/stores/ui";

export function OpenPrototypeButton() {
  return (
    <Button icon={<FlaskConical size={15} />} onClick={() => setUI({ protoOpen: true })} aria-haspopup="dialog">
      Open prototype controls
    </Button>
  );
}
