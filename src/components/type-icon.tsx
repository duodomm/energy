"use client";

import { Wind, Sun, Droplets, Sprout, Flame, type LucideIcon } from "lucide-react";
import type { EnergyTypeId } from "@/lib/energy";

const ICONS: Record<EnergyTypeId, LucideIcon> = {
  wind: Wind,
  solar: Sun,
  hydro: Droplets,
  biomass: Sprout,
  geothermal: Flame,
};

export function TypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = ICONS[type as EnergyTypeId] ?? Sun;
  return <Icon className={className} aria-hidden />;
}
