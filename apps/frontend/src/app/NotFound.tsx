import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { LinkButton } from '../components/Button'
import s from './NotFound.module.css'

export function NotFound() {
  const error = useRouteError()
  const es404 = !error || (isRouteErrorResponse(error) && error.status === 404)
  return (
    <main className={s.page}>
      <h1 className={s.title}>{es404 ? 'Esta página no existe' : 'Algo salió mal'}</h1>
      <p className={s.text}>
        {es404 ? 'Puede que el enlace esté mal escrito.' : 'Intenta de nuevo; tu borrador de catación está a salvo.'}
      </p>
      <LinkButton to="/" size="md">
        Volver al mapa
      </LinkButton>
    </main>
  )
}
