# Cuncho

**Cuncho** — tagline: *"La huella del cuncho"*. (Antes "Coffee Map Colombia"; el nombre técnico del repo/paquetes puede seguir usando `coffee_map` / `coffee-map` sin problema.)

Proyecto de portafolio: red social / bitácora de cataciones de café de especialidad en Colombia, con mapa geoposicionado y motor de recomendaciones. Debe demostrar dominio de **Nest.js** (backend) y **React** (frontend).

## Referencias de diseño

La carpeta `design/` contiene las pantallas aprobadas (formato `.dc.html`: HTML con estilos inline + una clase `Component` en JS con la lógica de ejemplo). Son la referencia visual y de comportamiento; no son código de producción. Replicar layout, colores, tipografía y comportamiento en componentes React.

| Archivo | Pantalla |
|---|---|
| `Main.dc.html` | Explorar: mapa, header flotante con botón GPS, pines con puntaje, pin recomendado con halo pulsante, popup, bottom bar + FAB |
| `Acciones.dc.html` | Bottom sheet del FAB: "Registrar catación guiada" / "Pedir recomendación" |
| `Paso1.dc.html` | Catación paso 1: lugar detectado por GPS, cafeterías cercanas, crear lugar nuevo |
| `Paso2.dc.html` | Catación paso 2: variedad, finca/región, proceso, método |
| `Paso3.dc.html` | Catación paso 3: slider de acidez con etiqueta dinámica, notas de sabor multi-selección, puntaje SCA/personal |
| `Recomendacion.dc.html` | Selección de descriptores + tarjeta de resultado (lógica real de ranking en el script) |
| `Bitacora.dc.html` | Historial personal de cataciones + estadísticas |
| `Arquitectura.dc.html` | Esquema JSON, Haversine, Jaccard, fórmula de puntaje |

## Sistema visual (Warm Artisan)

- Fondo `#FAF5EE`, superficies `#FFFDF9`
- Texto `#2C1810` (títulos), `#3C2A21` (cuerpo), `#5E4838` / `#7A6352` (secundario)
- Acento terracota `#C85A32` / `#E07A5F` (FAB en gradiente, progreso, selección)
- Botones con texto blanco: `#B24F2B` (por contraste AA; `#C85A32` no alcanza 4.5:1)
- Seleccionado: fondo `#F8E6DC`, borde `#C85A32`, texto `#8F3D1E`
- Bordes `#EADBC8` / `#E5D5C5`
- Tipografía: Fraunces (títulos) + Manrope (texto)
- Ubicación del usuario: `#3A7CA5`
- Mapa: Leaflet / react-leaflet con tiles CartoDB Voyager (atribución OpenStreetMap · CARTO)

## Modelo de datos (catación)

```json
{
  "id": "cat_0192",
  "usuario_id": "usr_031",
  "creado_en": "2026-09-28T16:40:00-05:00",
  "lugar": { "id": "loc_origen", "nombre": "Origen Cafetería", "lat": 5.0689, "lng": -75.5174 },
  "grano": { "variedad": "Bourbon Rosado", "finca": "...", "region": "Pitalito, Huila", "proceso": "Anaeróbico", "metodo": "Aeropress" },
  "sensorial": {
    "acidez": { "nivel": 3, "tipo": "Cítrica" },
    "notas": ["Frutos Rojos", "Hibisco", "Cítricos"],
    "descriptores": ["frutal", "floral"],
    "puntaje": 92.0,
    "escala": "SCA"
  }
}
```

- Proceso: Lavado | Natural | Honey | Anaeróbico
- Método: V60 | Aeropress | Espresso | Chemex | Prensa Francesa
- Acidez 1–5: Láctica, Málica, Cítrica, Tartárica, Fosfórica
- Descriptores: frutal, chocolate, floral, dulce. Cada nota del catálogo mapea a uno o a ninguno
- Notas: catálogo de ~110 notas de la rueda de sabores SCA en español (`FLAVOR_NOTES` en la API; copia en el frontend, `notasCafe.ts`). Las familias Especias, Tostado, Verde, Ácido/Fermentado y Otros no tienen descriptor. Se aceptan notas personalizadas (2–40 caracteres) sin descriptor; el frontend las busca con un buscador que muestra las 10 mejores coincidencias
- Escala SCA: ≥90 Excepcional, 85–89.99 Excelente, 80–84.99 Muy bueno

## Algoritmo de recomendación

1. Pre-filtro por bounding box, luego Haversine (R = 6371 km); radio por defecto 2.5 km.
2. Similitud Jaccard entre descriptores pedidos (A) y descriptores agregados del lugar (B). Solo J > 0.
3. Puntaje: `S = 0.60·J + 0.25·(1 − d/R) + 0.15·(puntaje/100)` (pesos configurables).
4. Devolver ranking; la UI muestra el primero y permite pasar al siguiente.

## Pendiente de decidir

- Base de datos (sugerencia: PostgreSQL + PostGIS para consultas geoespaciales), ORM, autenticación, monorepo o repos separados.
- Origen del café en el mapa (finca/región) como segunda capa geográfica.
- Los nombres de cafeterías y puntajes de los diseños son datos de ejemplo.
