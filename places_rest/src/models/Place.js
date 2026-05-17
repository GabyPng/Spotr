/**
 * Modelo Mongoose `Place` (colección `places`).
 *
 * Documento principal de la aplicación. `maps_graphql` lee esta misma
 * colección (con una proyección ligera) para alimentar el mapa, por lo que
 * el nombre de la colección debe mantenerse sincronizado entre ambos
 * servicios.
 *
 * `location` usa formato GeoJSON Point con un índice `2dsphere` que habilita
 * consultas geoespaciales eficientes ("lugares cerca de mí").
 */

import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
    // Autor de la publicación (username tomado del JWT al publicar).
    // Permite que el feed muestre quién subió cada spot, como en Instagram.
    author: { type: String, default: 'Explorador', trim: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    tags: [{ type: String }],
    bestTime: { type: String, default: '' },
    pinColor: { type: String, default: '#1b1b1b' },
    archived: { type: Boolean, default: false },
    // Formato GeoJSON para coordenadas (Longitud, Latitud)
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    comments: [{
        username: { type: String, required: true },
        text:     { type: String, required: true },
        createdAt:{ type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Creamos un índice geoespacial para búsquedas eficientes en el mapa
placeSchema.index({ location: '2dsphere' });

export default mongoose.model('Place', placeSchema);