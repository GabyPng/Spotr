# Spotr · Microservicio REST de lugares (`places_rest`)

Servicio Express **interno** que implementa el CRUD de lugares y persiste en
la colección `places` de MongoDB Atlas.

> No es público. En producción solo recibe tráfico **reenviado por el API
> Gateway**, que ya validó el JWT. Por eso este servicio **no tiene
> middleware de autenticación propio**: puedes probarlo directamente en su
> puerto sin token.

Arquitectura global: [`../README.md`](../README.md).

---

## Puesta en marcha

```bash
npm install
cp ../.env.example .env   # solo necesita MONGO_URI
npm run dev               # → http://localhost:4000
```

El servidor solo escucha si la conexión a MongoDB tiene éxito.

### Variables de entorno

| Variable    | Descripción                                       |
|-------------|---------------------------------------------------|
| `MONGO_URI` | Conexión a MongoDB Atlas (colección `places`)     |
| `PORT`      | Opcional (por defecto `4000`)                     |

---

## Endpoints

Base URL: `http://localhost:4000` · todas montadas bajo `/api/places`.

| Método  | Ruta                       | Descripción                          |
|---------|----------------------------|--------------------------------------|
| `POST`  | `/api/places`              | Crear un lugar                       |
| `GET`   | `/api/places`              | Listar lugares (más reciente primero)|
| `POST`  | `/api/places/:id/comments` | Añadir un comentario                 |
| `PATCH` | `/api/places/:id/archive`  | Archivar / restaurar un lugar        |
| `DELETE`| `/api/places/:id`          | Eliminar un lugar permanentemente    |

Ninguna requiere cabecera de autorización al llamarse directamente.

---

## Modelo `Place`

```js
{
  title:       String,   // requerido
  description: String,   // requerido
  imageUrl:    String,   // requerido
  tags:        [String],
  bestTime:    String,
  pinColor:    String,   // por defecto "#1b1b1b"
  archived:    Boolean,  // por defecto false
  location: { type: "Point", coordinates: [lng, lat] },  // GeoJSON, 2dsphere
  comments: [{ username, text, createdAt }],
  createdAt, updatedAt   // timestamps
}
```

> ⚠️ El endpoint de creación recibe `lat` y `lng` **separados**; internamente
> los reordena a `coordinates: [lng, lat]` (convención GeoJSON de MongoDB).

---

## Ejemplos para Postman

Crea una variable de entorno `restUrl` = `http://localhost:4000`.

### 1. Crear lugar

```
POST {{restUrl}}/api/places
Content-Type: application/json
```

Body (raw → JSON):

```json
{
  "title": "Café La Esquina",
  "description": "Luz natural por la mañana, perfecto para fotos de brunch.",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "tags": ["#cafe", "#brunch", "#aesthetic"],
  "bestTime": "Mañana (8am–12pm)",
  "pinColor": "#10b981",
  "lat": 21.5095,
  "lng": -104.8957
}
```

Respuesta `201`:

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9c0d",
  "title": "Café La Esquina",
  "description": "Luz natural por la mañana, perfecto para fotos de brunch.",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "tags": ["#cafe", "#brunch", "#aesthetic"],
  "bestTime": "Mañana (8am–12pm)",
  "pinColor": "#10b981",
  "archived": false,
  "location": { "type": "Point", "coordinates": [-104.8957, 21.5095] },
  "comments": [],
  "createdAt": "2026-05-16T10:00:00.000Z",
  "updatedAt": "2026-05-16T10:00:00.000Z"
}
```

---

### 2. Listar lugares

```
GET {{restUrl}}/api/places
```

Respuesta `200`: arreglo de documentos `Place` ordenados por `createdAt`
descendente.

---

### 3. Añadir comentario

```
POST {{restUrl}}/api/places/665f1a2b3c4d5e6f7a8b9c0d/comments
Content-Type: application/json
```

Body (raw → JSON):

```json
{ "username": "alberto", "text": "El café de almendra está increíble." }
```

Respuesta `201`:

```json
{
  "username": "alberto",
  "text": "El café de almendra está increíble.",
  "createdAt": "2026-05-16T10:05:00.000Z",
  "_id": "665f1b..."
}
```

---

### 4. Archivar / restaurar

```
PATCH {{restUrl}}/api/places/665f1a2b3c4d5e6f7a8b9c0d/archive
Content-Type: application/json
```

Body (raw → JSON) — para archivar:

```json
{ "archived": true }
```

Para restaurar usa `{ "archived": false }`. Si el cuerpo va vacío, archiva
por defecto. Respuesta `200`: el lugar actualizado.

---

### 5. Eliminar lugar

```
DELETE {{restUrl}}/api/places/665f1a2b3c4d5e6f7a8b9c0d
```

Respuesta `200`:

```json
{ "message": "Lugar eliminado", "id": "665f1a2b3c4d5e6f7a8b9c0d" }
```

---

## Errores comunes

| Código | Causa                                              |
|--------|----------------------------------------------------|
| `404`  | El `:id` no corresponde a ningún lugar             |
| `500`  | Error de validación de Mongoose o conexión a la BD |
