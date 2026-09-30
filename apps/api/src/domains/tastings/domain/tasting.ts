import type { AcidityLevel, AcidityType, BrewMethod, Descriptor, Process, Scale } from '../../catalog';

export interface Tasting {
  id: string;
  userId: string;
  placeId: string;
  createdAt: Date;
  variety: string;
  farm: string | null;
  region: string | null;
  process: Process;
  method: BrewMethod;
  acidityLevel: AcidityLevel;
  acidityType: AcidityType;
  notes: string[];
  descriptors: Descriptor[];
  score: number;
  scale: Scale;
  normalizedScore: number;
}

export interface UserTastingStats {
  total: number;
  avgNormalizedScore: number | null;
  distinctPlaces: number;
  lastTastingAt: Date | null;
  byDescriptor: { key: string; total: number }[];
  byMethod: { key: string; total: number }[];
  byProcess: { key: string; total: number }[];
}
