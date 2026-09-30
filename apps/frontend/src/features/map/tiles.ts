const CARTO_KEY = import.meta.env.VITE_CARTO_KEY

/**
 * CARTO Voyager. Desde 2026 CARTO exige una API key (gratuita) como `?key=`;
 * sin ella los tiles salen con la marca "API KEY REQUIRED".
 */
export const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' +
  (CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : '')

/** Atribución obligatoria de OpenStreetMap y CARTO. */
export const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

export const esTactil = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
