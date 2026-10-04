export { CatalogModule } from './catalog.module';
export { CatalogService } from './application/catalog.service';
export {
  ACIDITY_TYPES,
  BREW_METHODS,
  DESCRIPTORS,
  PROCESSES,
  SCALE_RULES,
  SCALES,
  InvalidNotesError,
  FLAVOR_NOTES,
  isDescriptor,
} from './domain/catalog';
export type { AcidityLevel, AcidityType, BrewMethod, Descriptor, Process, Scale } from './domain/catalog';
