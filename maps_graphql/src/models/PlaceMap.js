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