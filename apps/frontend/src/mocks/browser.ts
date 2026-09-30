import { setupWorker } from 'msw/browser'
import { crearHandlers } from './handlers'

export const worker = setupWorker(...crearHandlers())
