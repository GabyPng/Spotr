/**
 * Modelo Mongoose `PlaceMap` — vista ligera de la colección `places`.
 *
 * IMPORTANTE: NO es una colección propia. Mediante `{ collection: 'places' }`
 * apunta a la MISMA colección que escribe `places_rest`, pero declarando solo
 * `title` y `location`. Así el mapa lee lo justo sin acoplarse al esquema
 * completo del lugar. Si cambia el nombre de la colección en places_rest,
 * debe cambiar también aquí.
 */

import mongoose from 'mongoose';

// Solo definimos los campos que nos importan para el mapa
const placeMapSchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [Longitud, Latitud]
    }
}, { collection: 'places' }); // Forzamos la lectura de la colección del MS REST

export default mongoose.model('PlaceMap', placeMapSchema);