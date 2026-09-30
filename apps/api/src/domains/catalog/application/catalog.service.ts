import { Injectable } from '@nestjs/common';
import { CatalogResponseDto } from '../api/catalog-response.dto';
import {
  ACIDITY_BY_LEVEL,
  ACIDITY_LEVELS,
  BREW_METHODS,
  Descriptor,
  DESCRIPTOR_INFO,
  descriptorsFromNotes,
  NOTE_DESCRIPTOR,
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
    notas: Object.entries(NOTE_DESCRIPTOR).map(([nombre, descriptor]) => ({ nombre, descriptor })),
    descriptores: DESCRIPTOR_INFO.map((d) => ({ id: d.id, etiqueta: d.label, pista: d.hint })),
    escalas: SCALES.map((id) => ({ id, min: SCALE_RULES[id].min, max: SCALE_RULES[id].max, paso: SCALE_RULES[id].step })),
  };

  getCatalog(): CatalogResponseDto {
    return this.catalog;
  }

  /** Deriva descriptores desde las notas (lanza UnknownNotesError si alguna no existe). */
  descriptorsFromNotes(notes: readonly string[]): Descriptor[] {
    return descriptorsFromNotes(notes);
  }

  descriptorOf(note: string): Descriptor | undefined {
    return NOTE_DESCRIPTOR[note];
  }
}
