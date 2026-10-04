import { expect, test } from '@playwright/test'

test('registra una catación guiada completa y aparece en la bitácora', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Cuncho' })).toBeVisible()

  // Menú de acciones (bottom sheet sobre la ruta actual).
  await page.getByRole('button', { name: 'Abrir acciones' }).click()
  await expect(page.getByRole('dialog', { name: '¿Qué quieres hacer?' })).toBeVisible()
  await page.getByRole('link', { name: /Registrar catación guiada/ }).click()

  // Paso 1: el GPS detecta la cafetería.
  await expect(page).toHaveURL(/\/catar\/lugar$/)
  const origen = page.getByRole('button', { name: /Origen Cafetería.*Detectada por GPS/ })
  await expect(origen).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Continuar con Origen Cafetería' }).click()

  // Paso 2: validación y ficha del grano.
  await expect(page).toHaveURL(/\/catar\/grano$/)
  await page.getByRole('button', { name: 'Continuar a la evaluación' }).click()
  await expect(page.getByRole('alert')).toContainText('Falta la variedad, el proceso, el método')
  await page.getByRole('button', { name: 'Geisha' }).click()
  await page.getByLabel('Región').fill('Piendamó, Cauca')
  await page.getByRole('group', { name: 'Proceso' }).getByRole('button', { name: 'Lavado' }).click()
  await page.getByRole('button', { name: 'V60' }).click()
  await page.getByRole('button', { name: 'Continuar a la evaluación' }).click()

  // Paso 3: volver atrás no pierde datos.
  await expect(page).toHaveURL(/\/catar\/sensorial$/)
  await page.getByRole('button', { name: 'Volver' }).click()
  await expect(page.getByRole('button', { name: 'Geisha' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Región')).toHaveValue('Piendamó, Cauca')
  await page.getByRole('button', { name: 'Continuar a la evaluación' }).click()

  await page.getByLabel('Acidez').fill('4')
  await expect(page.getByText('Tartárica', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Jazmín', exact: true }).click()
  await page.getByRole('button', { name: 'Cítricos', exact: true }).click()
  await expect(page.getByText('2 notas')).toBeVisible()
  await page.getByRole('button', { name: 'Guardar en mi bitácora' }).click()

  // Bitácora
  await expect(page).toHaveURL(/\/bitacora$/)
  await expect(page.getByRole('status').filter({ hasText: 'Catación guardada' })).toBeVisible()
  const primera = page.getByRole('article').first()
  await expect(primera).toContainText('Origen Cafetería')
  await expect(primera).toContainText('Geisha · Lavado · V60')
  await expect(page.getByRole('definition').first()).toHaveText('5')
})

test('el borrador sobrevive a una recarga', async ({ page }) => {
  await page.goto('/catar/lugar')
  await page.getByRole('button', { name: 'Continuar con Origen Cafetería' }).click()
  await page.getByLabel('Nombre del café / Variedad').fill('Pink Bourbon')
  await page.reload()
  await expect(page.getByLabel('Nombre del café / Variedad')).toHaveValue('Pink Bourbon')
})

test('la recomendación se puede ver en el mapa con el pin destacado', async ({ page }) => {
  await page.goto('/recomendar')
  await page.getByRole('button', { name: /Frutal \/ Cítrico/ }).click()
  await expect(page.getByRole('heading', { name: 'Origen Cafetería' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver en el mapa' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Recomendado: Origen Cafetería, 92 puntos' })).toBeVisible()
  await expect(page.getByText('Recomendado para ti')).toBeVisible()
})

test('las notas se buscan en toda la rueda del café (máx. 10 resultados) y admiten notas propias', async ({ page }) => {
  await page.goto('/catar/lugar')
  await page.getByRole('button', { name: 'Continuar con Origen Cafetería' }).click()
  await page.getByRole('button', { name: 'Geisha' }).click()
  await page.getByRole('group', { name: 'Proceso' }).getByRole('button', { name: 'Lavado' }).click()
  await page.getByRole('button', { name: 'V60' }).click()
  await page.getByRole('button', { name: 'Continuar a la evaluación' }).click()

  const buscar = page.getByLabel('Buscar nota')
  const resultados = page.getByRole('group', { name: 'Resultados' }).getByRole('button')
  await expect(resultados).toHaveCount(10) // sugerencias

  await buscar.fill('a')
  await expect(resultados).toHaveCount(10)
  await expect(page.getByRole('status').filter({ hasText: 'Mostrando 10 de' })).toBeVisible()

  await buscar.fill('canela') // sin descriptor, pero válida
  await page.getByRole('button', { name: 'Canela', exact: true }).click()
  await buscar.fill('maracuya') // sin tilde
  await page.getByRole('button', { name: 'Maracuyá', exact: true }).click()
  await buscar.fill('sabor a pan tostado') // personalizada
  await page.getByRole('button', { name: /Agregar «Sabor a pan tostado»/ }).click()
  await expect(page.getByText('3 notas')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Notas elegidas' }).getByRole('listitem')).toHaveCount(3)

  await page.getByRole('button', { name: 'Guardar en mi bitácora' }).click()
  await expect(page).toHaveURL(/\/bitacora$/)
  await expect(page.getByRole('article').first()).toContainText('Geisha · Lavado · V60')
})
