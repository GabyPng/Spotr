# Spotr · Microservicio GraphQL de mapas (`maps_graphql`)

Servicio Apollo Server **interno** que expone una única query, `locations`,
usada para pintar los pines del mapa.

> No es público. En producción el API Gateway le reenvía la query. Puedes
> probarlo directamente en su puerto sin token.
>
> Lee la **misma colección `places`** que escribe `places_rest`, pero
> proyectando solo `title` y `location` para minimizar el tráfico del mapa.

Arquitectura global: [`../README.md`](../README.md).

---

## Puesta en marcha

```bash
npm install
cp ../.env.example .env   # solo necesita MONGO_URI
npm run dev               # → http://localhost:4001/graphql
```

El servidor solo arranca si la conexión a MongoDB tiene éxito.

### Variables de entorno

| Variable    | Descripción                                   |
|-------------|-----------------------------------------------|
| `MONGO_URI` | Conexión a MongoDB Atlas (colección `places`) |
| `PORT`      | Opcional (por defecto `4001`)                 |

---

## Esquema GraphQL

```graphql
type PlaceLocation {
  id: ID!
  title: String!
  lat: Float
  lng: Float
}

type Query {
  locations: [PlaceLocation]
}
```

El resolver convierte el arreglo GeoJSON `[lng, lat]` de MongoDB a campos
`lat`/`lng` explícitos.

> Nota: aquí la query se llama **`locations`**. El API Gateway la re-expone al
> frontend bajo el nombre **`mapLocations`**.

---

## Ejemplos para Postman

Endpoint: `http://localhost:4001/graphql` (crea la variable `gqlUrl`).

### Opción A — Body → GraphQL (recomendado)

En Postman: `POST {{gqlUrl}}` → pestaña **Body** → **GraphQL** → campo *Query*:

```graphql
query {
  locations {
    id
    title
    lat
    lng
  }
}
```

### Opción B — Body → raw JSON

```
POST {{gqlUrl}}
Content-Type: application/json
```

Body (raw → JSON):

```json
{ "query": "query { locations { id title lat lng } }" }
```

### Respuesta `200`

```json
{
  "data": {
    "locations": [
      {
        "id": "665f1a2b3c4d5e6f7a8b9c0d",
        "title": "Café La Esquina",
        "lat": 21.5095,
        "lng": -104.8957
      }
    ]
  }
}
```

Si no hay lugares en la BD, `locations` será un arreglo vacío.

---

## Errores comunes

| Síntoma                              | Causa probable                              |
|--------------------------------------|---------------------------------------------|
| `errors: ["Error al obtener las ubicaciones"]` | Fallo al consultar MongoDB        |
| Respuesta vacía / conexión rechazada | El servicio no arrancó (revisa `MONGO_URI`) |
| `lat`/`lng` en `null`                | Documento sin `location.coordinates` válido |
