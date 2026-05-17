/**
 * Esquema GraphQL del microservicio de mapas.
 *
 * `PlaceLocation` es la forma mínima que el mapa necesita para dibujar un pin:
 * id, título y coordenadas ya separadas en `lat`/`lng` (el resolver las
 * convierte desde el formato GeoJSON de MongoDB). Mantener este esquema
 * alineado con el `typeDefs` que el API Gateway expone al frontend.
 */
export const typeDefs = `#graphql
  type PlaceLocation {
    id: ID!
    title: String!
    lat: Float
    lng: Float
  }

  type Query {
    locations: [PlaceLocation]
  }
`;