import { Injectable } from '@nestjs/common';
import { CatalogResponseDto } from '../api/catalog-response.dto';
import {
  ACIDITY_BY_LEVEL,
  ACIDITY_LEVELS,
  BREW_METHODS,
  Descriptor,
  DESCRIPTOR_INFO,
  FLAVOR_NOTES,
  NOTE_DESCRIPTOR,
  resolveNotes,
  ResolvedNotes,
  PROCESSES,
  SCALE_RULES,
  SCALES,
  SUGGESTED_VARIETIES,
} from '../domain/catalog';

@Injectable()
export class CatalogService {
  private readonly catalog: CatalogResponseDto = {
    variedades: [...SUGGESTED_VARIETIES],
    procesos: [...PROCESSES],
    metodos: [...BREW_METHODS],
    acidez: ACIDITY_LEVELS.map((nivel) => ({
      nivel,
      tipo: ACIDITY_BY_LEVEL[nivel].type,
      etiqueta: ACIDITY_BY_LEVEL[nivel].label,
    })),
    notas: FLAVOR_NOTES.map(({ nombre, familia, descriptor }) => ({ nombre, familia, descriptor })),
    descriptores: DESCRIPTOR_INFO.map((d) => ({ id: d.id, etiqueta: d.label, pista: d.hint })),
    escalas: SCALES.map((id) => ({ id, min: SCALE_RULES[id].min, max: SCALE_RULES[id].max, paso: SCALE_RULES[id].step })),
  };

  getCatalog(): CatalogResponseDto {
    return this.catalog;
  }

  /** Resuelve las notas de una catación (lanza InvalidNotesError si alguna no es válida). */
  resolveNotes(notes: readonly string[]): ResolvedNotes {
    return resolveNotes(notes);
  }

  descriptorOf(note: string): Descriptor | undefined {
    return NOTE_DESCRIPTOR[note];
  }
}
