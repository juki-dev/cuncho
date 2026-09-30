/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_MOCKS?: string
  readonly VITE_MAP_DEFAULT_CENTER?: string
  /** API key pública de CARTO basemaps (se ve en el cliente; restríngela por dominio). */
  readonly VITE_CARTO_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
