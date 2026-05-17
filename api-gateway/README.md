# Spotr · API Gateway

Punto **único de entrada** de la plataforma. El frontend solo habla con este
servicio; nunca con los microservicios directamente.

Responsabilidades:

1. Autenticación: registro, login y emisión de JWT.
2. Verificación del JWT en todas las rutas protegidas.
3. Subida de imágenes a Cloudinary.
4. Proxy REST → `places_rest` (`:4000`) y GraphQL → `maps_graphql` (`:4001`).

> Visión global del proyecto y arquitectura: [`../README.md`](../README.md).

---

## Puesta en marcha

```bash
npm install
cp ../.env.example .env   # rellena los valores reales
npm run dev               # → http://localhost:5500
```

Depende de que `places_rest` (`:4000`) y `maps_graphql` (`:4001`) estén
arriba, porque les reenvía peticiones.

### Variables de entorno

| Variable                | Descripción                                  |
|-------------------------|----------------------------------------------|
| `MONGO_URI`             | Conexión a MongoDB Atlas (colección `users`) |
| `JWT_SECRET`            | Secreto para firmar/verificar los JWT        |
| `CLOUDINARY_CLOUD_NAME` | Cuenta de Cloudinary                         |
| `CLOUDINARY_API_KEY`    | API key de Cloudinary                        |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary                     |
| `PORT`                  | Opcional (por defecto `5500`)                |

---

## Endpoints

Base URL: `http://localhost:5500`

| Método  | Ruta                       | Auth | Descripción                       |
|---------|----------------------------|------|-----------------------------------|
| `POST`  | `/auth/register`           | —    | Crear usuario                     |
| `POST`  | `/auth/login`              | —    | Iniciar sesión (devuelve JWT)     |
| `POST`  | `/api/upload`              | ✅   | Subir imagen a Cloudinary         |
| `GET`   | `/api/places`              | ✅   | Listar lugares (proxy REST)       |
| `POST`  | `/api/places`              | ✅   | Crear lugar (proxy REST)          |
| `POST`  | `/api/places/:id/comments` | ✅   | Comentar un lugar (proxy REST)    |
| `PATCH` | `/api/places/:id/archive`  | ✅   | Archivar/restaurar (proxy REST)   |
| `DELETE`| `/api/places/:id`          | ✅   | Eliminar lugar (proxy REST)       |
| `POST`  | `/graphql`                 | ✅   | Query del mapa (proxy GraphQL)    |

`✅` = requiere cabecera `Authorization: Bearer <token>`.

---

## Ejemplos para Postman

### Flujo recomendado

1. Crea un *Environment* en Postman con:
   - `baseUrl` = `http://localhost:5500`
   - `token` = *(vacío de momento)*
2. Ejecuta **Register** → **Login**.
3. Copia el `token` de la respuesta del login en la variable `token`.
4. Todas las peticiones protegidas usan `Authorization: Bearer {{token}}`.

> Truco: en la pestaña **Tests** del request de login, pega esto para guardar
> el token automáticamente:
> ```js
> pm.environment.set("token", pm.response.json().token);
> ```

---

### 1. Registro

```
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

Body (raw → JSON):

```json
{
  "username": "alberto",
  "password": "miPassword123"
}
```

Respuesta `201`:

```json
{ "message": "Usuario registrado con éxito" }
```

---

### 2. Login

```
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Body (raw → JSON):

```json
{
  "username": "alberto",
  "password": "miPassword123"
}
```

Respuesta `200`:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### 3. Subir imagen

```
POST {{baseUrl}}/api/upload
Authorization: Bearer {{token}}
```

Body → **form-data**:

| Key     | Type | Value                  |
|---------|------|------------------------|
| `image` | File | *(selecciona un .jpg)* |

Respuesta `200`:

```json
{ "url": "https://res.cloudinary.com/.../spotr/abc123.jpg" }
```

---

### 4. Crear lugar

```
POST {{baseUrl}}/api/places
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body (raw → JSON):

```json
{
  "title": "Mirador del Cerro",
  "description": "Vista 360° de la ciudad, ideal al atardecer.",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  "tags": ["#mirador", "#atardecer"],
  "bestTime": "Hora dorada (5–7pm)",
  "pinColor": "#ef4444",
  "lat": 21.5095,
  "lng": -104.8957
}
```

Respuesta `201`: el documento creado (incluye `_id`, `location` en GeoJSON,
`createdAt`).

---

### 5. Listar lugares

```
GET {{baseUrl}}/api/places
Authorization: Bearer {{token}}
```

Respuesta `200`: arreglo de lugares (del más reciente al más antiguo).

---

### 6. Comentar un lugar

```
POST {{baseUrl}}/api/places/<ID_DEL_LUGAR>/comments
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body (raw → JSON):

```json
{ "username": "alberto", "text": "¡Llegué al amanecer y valió la pena!" }
```

Respuesta `201`: el comentario creado.

---

### 7. Archivar / restaurar

```
PATCH {{baseUrl}}/api/places/<ID_DEL_LUGAR>/archive
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body (raw → JSON):

```json
{ "archived": true }
```

Respuesta `200`: el lugar actualizado.

---

### 8. Eliminar un lugar

```
DELETE {{baseUrl}}/api/places/<ID_DEL_LUGAR>
Authorization: Bearer {{token}}
```

Respuesta `200`:

```json
{ "message": "Lugar eliminado", "id": "<ID_DEL_LUGAR>" }
```

---

### 9. GraphQL (ubicaciones del mapa)

```
POST {{baseUrl}}/graphql
Authorization: Bearer {{token}}
Content-Type: application/json
```

Body (raw → JSON):

```json
{ "query": "query { mapLocations { id title lat lng } }" }
```

Respuesta `200`:

```json
{
  "data": {
    "mapLocations": [
      { "id": "665f...", "title": "Mirador del Cerro", "lat": 21.5095, "lng": -104.8957 }
    ]
  }
}
```

> En Postman también puedes usar el modo **Body → GraphQL** y pegar solo
> `query { mapLocations { id title lat lng } }`.

---

## Errores comunes

| Código | Causa                                                        |
|--------|--------------------------------------------------------------|
| `401`  | Falta la cabecera `Authorization`                            |
| `403`  | Token inválido o expirado (vuelve a hacer login)             |
| `404`  | Usuario no encontrado (login) o lugar inexistente            |
| `500`  | Microservicio REST/GraphQL caído o error de comunicación     |
