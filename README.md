# Spotr

> Red social para descubrir, mapear y compartir los lugares más *instagrameables* de la ciudad.

Spotr es una aplicación web responsiva donde los usuarios publican "spots" (cafeterías,
murales, miradores, restaurantes, paisajes) con foto, ubicación en mapa, etiquetas y la
mejor hora para visitarlos. Otros usuarios los exploran en un feed visual o sobre un mapa
interactivo, los comentan y los guardan.

El diseño es **image-first**: la interfaz desaparece para que las fotos sean las
protagonistas. La guía visual completa (paleta monocromática, tipografía, espaciado) vive
en [`DESIGN.md`](DESIGN.md).

---

## Tabla de contenidos

1. [Arquitectura](#arquitectura)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Puertos y servicios](#puertos-y-servicios)
5. [Variables de entorno](#variables-de-entorno)
6. [Puesta en marcha](#puesta-en-marcha)
7. [Flujo de una petición](#flujo-de-una-petición)
8. [Referencia de la API](#referencia-de-la-api)
9. [Modelo de datos](#modelo-de-datos)
10. [Notas para evaluación / demo](#notas-para-evaluación--demo)

---

## Arquitectura

Spotr usa una arquitectura de **microservicios detrás de un API Gateway**. El frontend
nunca habla directamente con los microservicios: todo pasa por el Gateway, que centraliza
autenticación (JWT) y subida de imágenes.

```
                 ┌─────────────────────────┐
                 │   Frontend (React/Vite) │   :5174
                 │   feed · mapa · perfil  │
                 └────────────┬────────────┘
                              │  HTTP + JWT (Bearer)
                              ▼
                 ┌─────────────────────────┐
                 │      API Gateway        │   :5500
                 │  · Auth (registro/login)│
                 │  · Verificación de JWT  │
                 │  · Upload → Cloudinary  │
                 │  · Proxy REST y GraphQL │
                 └──────┬───────────┬──────┘
                        │           │
            REST proxy  │           │  GraphQL proxy
                        ▼           ▼
        ┌───────────────────┐   ┌────────────────────┐
        │   places_rest     │   │   maps_graphql     │
        │   CRUD de lugares │   │  ubicaciones mapa  │
        │       :4000       │   │       :4001        │
        └─────────┬─────────┘   └──────────┬─────────┘
                  │                         │
                  └──────────┬──────────────┘
                             ▼
                   ┌───────────────────┐
                   │   MongoDB Atlas   │
                   │  colección places │
                   │  colección users  │
                   └───────────────────┘
```

Ambos microservicios apuntan a la **misma base de datos MongoDB Atlas**. `places_rest`
escribe y lee la colección `places`; `maps_graphql` lee esa misma colección (proyectando
solo título y coordenadas) para alimentar el mapa de forma ligera.

> El archivo [`DESIGN.md`](DESIGN.md) describe la *visión de diseño original*
> (GraphQL monolítico, modelos algo distintos). La arquitectura **implementada** y vigente
> es la que documenta este README.

---

## Stack tecnológico

| Capa            | Tecnología                                                        |
|-----------------|-------------------------------------------------------------------|
| Frontend        | React 19, Vite, React Router, Tailwind CSS, React-Leaflet (mapas) |
| API Gateway     | Node.js, Express, Apollo Server, JWT, Multer, Cloudinary, Axios   |
| Microservicio 1 | Express REST (`places_rest`) + Mongoose                           |
| Microservicio 2 | Apollo Server GraphQL (`maps_graphql`) + Mongoose                 |
| Base de datos   | MongoDB Atlas (índice geoespacial `2dsphere`)                     |
| Imágenes        | Cloudinary (almacenamiento y CDN)                                 |

---

## Estructura del repositorio

```
spotr/
├── DESIGN.md              # Sistema de diseño y visión de producto
├── README.md              # Este archivo
├── .env.example           # Plantilla de variables de entorno
│
├── api-gateway/           # Punto único de entrada (puerto 5500)
│   ├── index.js           # Servidor: auth, upload, proxy REST + GraphQL
│   └── src/
│       ├── controllers/authController.js   # register() y login()
│       ├── middleware/authMiddleware.js    # verificarToken() (JWT)
│       └── models/User.js                  # Esquema de usuario
│
├── places_rest/           # Microservicio REST de lugares (puerto 4000)
│   ├── index.js
│   └── src/
│       ├── controllers/placeController.js  # CRUD + comentarios + archivar
│       ├── models/Place.js                 # Esquema de lugar (GeoJSON)
│       └── routes/placeRoutes.js           # Mapeo de rutas
│
├── maps_graphql/          # Microservicio GraphQL de mapas (puerto 4001)
│   ├── index.js
│   └── src/
│       ├── graphql/typeDefs.js             # Esquema GraphQL
│       ├── graphql/resolvers.js            # Resolver de ubicaciones
│       └── models/PlaceMap.js              # Vista ligera de `places`
│
└── frontend/              # SPA React (puerto 5174)
    ├── index.html         # Fuentes, iconos y animaciones CSS globales
    └── src/
        ├── main.jsx       # Punto de montaje de React
        ├── App.jsx        # Rutas y protección por token
        ├── pages/
        │   ├── Login.jsx       # Inicio de sesión / registro
        │   └── Dashboard.jsx   # Vista principal (feed + mapa)
        └── components/
            ├── MapView.jsx           # Mapa Leaflet con pines y popups
            ├── PublishModal.jsx      # Formulario para publicar un spot
            ├── PlaceDrawer.jsx       # Detalle del lugar + comentarios
            ├── NotificationsPanel.jsx# Notificaciones (datos de demo)
            └── ProfileView.jsx       # Perfil, stats y gestión de spots
```

---

## Puertos y servicios

| Servicio       | Puerto | Comando (`dev`)            | Responsabilidad                                  |
|----------------|--------|----------------------------|--------------------------------------------------|
| `frontend`     | 5174   | `npm run dev`              | Interfaz de usuario (SPA)                         |
| `api-gateway`  | 5500   | `npm run dev`              | Auth, upload y enrutamiento a microservicios     |
| `places_rest`  | 4000   | `npm run dev`              | CRUD de lugares, comentarios, archivar/eliminar  |
| `maps_graphql` | 4001   | `npm run dev`              | Query GraphQL `locations` para pintar el mapa    |

El frontend solo conoce el Gateway (`http://localhost:5500`). Los puertos 4000 y 4001 son
internos y no deben exponerse al cliente.

---

## Variables de entorno

Cada servicio de backend carga su configuración con `dotenv`. Copia
[`.env.example`](.env.example) a un archivo `.env` en la carpeta de cada servicio (o en la
raíz si ejecutas desde ahí) y rellena los valores reales.

| Variable                 | Usada por                       | Descripción                                  |
|--------------------------|---------------------------------|----------------------------------------------|
| `MONGO_URI`              | gateway, places_rest, maps_graphql | Cadena de conexión a MongoDB Atlas        |
| `JWT_SECRET`             | api-gateway                     | Secreto para firmar y verificar los JWT      |
| `CLOUDINARY_CLOUD_NAME`  | api-gateway                     | Nombre de la cuenta Cloudinary               |
| `CLOUDINARY_API_KEY`     | api-gateway                     | API key de Cloudinary                        |
| `CLOUDINARY_API_SECRET`  | api-gateway                     | API secret de Cloudinary                     |
| `PORT`                   | todos (opcional)                | Sobrescribe el puerto por defecto del servicio |

> Los archivos `.env` están en `.gitignore`. **Nunca** los subas al repositorio.

---

## Puesta en marcha

Requisitos: **Node.js 18+**, una base de datos **MongoDB Atlas** y una cuenta de
**Cloudinary**.

Abre **cuatro terminales** (una por servicio). Para cada servicio de backend, instala
dependencias y crea su `.env` la primera vez:

```bash
# 1) Microservicio REST de lugares
cd places_rest
npm install
npm run dev          # → http://localhost:4000

# 2) Microservicio GraphQL de mapas
cd maps_graphql
npm install
npm run dev          # → http://localhost:4001/graphql

# 3) API Gateway (depende de que 1 y 2 estén arriba)
cd api-gateway
npm install
npm run dev          # → http://localhost:5500

# 4) Frontend
cd frontend
npm install
npm run dev          # → http://localhost:5174
```

Abre `http://localhost:5174`, crea una cuenta y empieza a publicar spots.

> Orden recomendado de arranque: microservicios → gateway → frontend. El Gateway
> reenvía peticiones a 4000/4001, así que esos deben estar disponibles.

### Alternativa: Docker Compose

Para levantar **todo con un solo comando** (incluye una base de datos MongoDB
local), desde la raíz del repositorio:

```bash
cp .env.example .env   # opcional: pon tus credenciales de Cloudinary/JWT
docker compose up --build
```

Esto construye y arranca los cinco servicios:

| Servicio      | URL en el host          | Notas                                  |
|---------------|-------------------------|----------------------------------------|
| frontend      | http://localhost:5174   | Build de Vite servido por Nginx        |
| api-gateway   | http://localhost:5500   | Punto único de entrada                  |
| places_rest   | http://localhost:4000   | Interno (expuesto solo para depurar)    |
| maps_graphql  | http://localhost:4001   | Interno (expuesto solo para depurar)    |
| mongo         | localhost:27017         | MongoDB local con volumen persistente   |

- Por defecto usa el **MongoDB del contenedor**. Para usar **Atlas**, define
  `MONGO_URI` en `.env` y se usará automáticamente.
- El Gateway resuelve los microservicios por nombre de servicio
  (`PLACES_SERVICE_URL`, `MAPS_SERVICE_URL`) gracias a la red de Compose.
- Sin credenciales de Cloudinary la app funciona, pero la subida de imágenes
  fallará (puedes pegar URLs de imagen en su lugar).

Para detener y limpiar: `docker compose down` (añade `-v` para borrar también
los datos de MongoDB).

---

## Flujo de una petición

**Publicar un lugar** (ejemplo representativo del recorrido completo):

1. El usuario sube una imagen en `PublishModal`. El frontend hace
   `POST /api/upload` al Gateway con el archivo y el JWT.
2. El Gateway valida el token (`verificarToken`), sube el buffer a **Cloudinary** y
   devuelve la `secure_url`.
3. El frontend envía `POST /api/places` al Gateway con los datos del lugar y la URL.
4. El Gateway valida el JWT y **reenvía la petición vía Axios** a `places_rest`
   (`http://localhost:4000/api/places`).
5. `places_rest` guarda el documento en MongoDB con coordenadas en formato GeoJSON.
6. El mapa (`MapView`) consulta el Gateway por GraphQL; el Gateway reenvía la query a
   `maps_graphql`, que lee la misma colección y devuelve `{ id, title, lat, lng }`.

---

## Referencia de la API

Todas las rutas son relativas al Gateway: `http://localhost:5500`.

### Autenticación (públicas)

| Método | Ruta             | Cuerpo                  | Respuesta                  |
|--------|------------------|-------------------------|----------------------------|
| `POST` | `/auth/register` | `{ username, password }`| `201` mensaje de éxito     |
| `POST` | `/auth/login`    | `{ username, password }`| `200` `{ token }` (JWT 7d) |

### Protegidas (requieren cabecera `Authorization: Bearer <token>`)

| Método  | Ruta                          | Descripción                          |
|---------|-------------------------------|--------------------------------------|
| `POST`  | `/api/upload`                 | Sube una imagen a Cloudinary         |
| `GET`   | `/api/places`                 | Lista todos los lugares              |
| `POST`  | `/api/places`                 | Crea un lugar                        |
| `POST`  | `/api/places/:id/comments`    | Añade un comentario                  |
| `PATCH` | `/api/places/:id/archive`     | Archiva / restaura un lugar          |
| `DELETE`| `/api/places/:id`             | Elimina un lugar permanentemente     |
| `POST`  | `/graphql`                    | Query `locations` para el mapa       |

GraphQL expuesto por el Gateway:

```graphql
query {
  mapLocations { id title lat lng }
}
```

---

## Modelo de datos

**Colección `users`** (gestionada por el Gateway):

```js
{ username: String (único), password: String (hash bcrypt) }
```

**Colección `places`** (escrita por `places_rest`, leída también por `maps_graphql`):

```js
{
  title:       String,                 // requerido
  description: String,                 // requerido
  imageUrl:    String,                 // requerido (URL de Cloudinary)
  tags:        [String],               // ej. ["#aesthetic", "#brunch"]
  bestTime:    String,                 // ej. "Hora dorada (5–7pm)"
  pinColor:    String,                 // color del pin en el mapa
  archived:    Boolean,                // oculto del feed/mapa si true
  location: {                          // GeoJSON Point — índice 2dsphere
    type: "Point",
    coordinates: [Longitud, Latitud]   // ⚠️ longitud primero
  },
  comments: [{ username, text, createdAt }],
  createdAt, updatedAt                  // timestamps de Mongoose
}
```

> Convención GeoJSON de MongoDB: `coordinates` es `[longitud, latitud]`, **no** al revés.
> El frontend siempre desestructura como `const [lng, lat] = ...`.

---

## Notas para evaluación / demo

Spotr se construyó en un fin de semana como proyecto académico, con foco en la
**experiencia de usuario**. Algunas funciones de la interfaz son "espejismos"
intencionales: muestran datos estáticos y convincentes en vez de lógica de backend real,
porque su valor en la demo es visual:

- **Notificaciones** (`NotificationsPanel`) — lista de ejemplo fija.
- **Estadísticas y nivel del perfil** (`ProfileView`) — números de demostración.
- **Pestaña "Guardados"** — reutiliza los spots reales no archivados como wishlist.
- **Likes y rating "4.8"** — visuales, no persistidos.

Las funciones **reales y persistidas** son: autenticación, publicación de lugares (con
subida de imagen a Cloudinary), listado en feed y mapa, comentarios, y archivar/eliminar
spots propios.
