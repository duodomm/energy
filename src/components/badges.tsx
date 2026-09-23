"use client";

import { Badge } from "@/components/ui/badge";
import { TypeIcon } from "@/components/type-icon";
import { ENERGY_TYPE_META, STATUS_META, type EnergyTypeId, type ProjectStatus } from "@/lib/energy";

export function TypeBadge({ type }: { type: string }) {
  const meta = ENERGY_TYPE_META[type as EnergyTypeId];
  if (!meta) return null;
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 border text-[11px] font-semibold"
      style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}
    >
      <TypeIcon type={type} className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as ProjectStatus];
  if (!meta) return null;
  return (
    <Badge
      variant="outline"
      className="text-[11px] font-semibold"
      style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}12` }}
    >
      {meta.label}
    </Badge>
  );
}
