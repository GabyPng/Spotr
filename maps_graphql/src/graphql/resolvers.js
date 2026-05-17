/**
 * Resolvers del microservicio de mapas.
 *
 * `locations` trae solo `title` y `location` de cada lugar y traduce el
 * arreglo GeoJSON `[lng, lat]` de MongoDB a campos `lat`/`lng` explícitos,
 * que es lo que espera React-Leaflet en el frontend.
 */

import PlaceMap from '../models/PlaceMap.js';

export const resolvers = {
    Query: {
        /** Devuelve todas las ubicaciones para pintar pines en el mapa. */
        locations: async () => {
            try {
                // Traemos solo el título y la ubicación para ahorrar memoria
                const places = await PlaceMap.find({}, 'title location');
                
                return places.map(place => ({
                    id: place._id.toString(),
                    title: place.title,
                    // En GeoJSON de MongoDB: el índice 0 es Longitud y el 1 es Latitud
                    lat: place.location.coordinates[1],
                    lng: place.location.coordinates[0]
                }));
            } catch (error) {
                console.error("Error en MS GraphQL consultando mapas:", error);
                throw new Error("Error al obtener las ubicaciones");
            }
        }
    }
};