import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    tags: [{ type: String }],
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
    }
}, { timestamps: true });

// Creamos un índice geoespacial para búsquedas eficientes en el mapa
placeSchema.index({ location: '2dsphere' });

export default mongoose.model('Place', placeSchema);