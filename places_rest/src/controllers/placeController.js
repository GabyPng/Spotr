import Place from '../models/Place.js';

// Operación: Crear un nuevo lugar
export const createPlace = async (req, res) => {
    try {
        const { title, description, imageUrl, tags, lng, lat } = req.body;

        const newPlace = new Place({
            title,
            description,
            imageUrl,
            tags,
            location: {
                type: 'Point',
                coordinates: [lng, lat] // MongoDB requiere Longitud primero, luego Latitud
            }
        });

        const savedPlace = await newPlace.save();
        res.status(201).json(savedPlace);
    } catch (error) {
        console.error("Error creando lugar:", error);
        res.status(500).json({ error: 'Error al guardar el lugar en la base de datos' });
    }
};

// Operación: Obtener todos los lugares
export const getPlaces = async (req, res) => {
    try {
        const places = await Place.find().sort({ createdAt: -1 });
        res.status(200).json(places);
    } catch (error) {
        console.error("Error obteniendo lugares:", error);
        res.status(500).json({ error: 'Error al obtener los lugares' });
    }
};