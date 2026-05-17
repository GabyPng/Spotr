/**
 * Controlador de lugares (places_rest).
 *
 * Cada handler corresponde a una ruta de placeRoutes.js. Todos asumen que el
 * API Gateway ya autenticó la petición. Las respuestas de error devuelven
 * `{ error }` con el código HTTP adecuado y registran el detalle en consola.
 */

import Place from '../models/Place.js';

/**
 * POST /api/places — Crea un nuevo lugar.
 *
 * Recibe `lat`/`lng` por separado y los reordena al formato GeoJSON que exige
 * MongoDB: `coordinates: [longitud, latitud]`. `pinColor` cae a negro si no
 * se especifica.
 *
 * @param {import('express').Request}  req  Cuerpo: author, title, description,
 *   imageUrl, tags, bestTime, pinColor, lng, lat.
 * @param {import('express').Response} res  `201` con el documento creado;
 *   `400` si falta la imagen (obligatoria).
 */
export const createPlace = async (req, res) => {
    try {
        const { author, title, description, imageUrl, tags, bestTime, pinColor, lng, lat } = req.body;

        // La imagen es obligatoria para publicar un lugar
        if (!imageUrl || !imageUrl.trim()) {
            return res.status(400).json({ error: 'La imagen es obligatoria para publicar un lugar.' });
        }

        const newPlace = new Place({
            author: author || 'Explorador',
            title,
            description,
            imageUrl,
            tags,
            bestTime,
            pinColor: pinColor || '#1b1b1b',
            location: {
                type: 'Point',
                coordinates: [lng, lat] // MongoDB requiere Longitud primero, luego Latitud
            }
        });

        const savedPlace = await newPlace.save();
        res.status(201).json(savedPlace);
    } catch (error) {
        console.error("Error creando lugar:", error.name, error.message);
        if (error.errors) console.error("Campos inválidos:", JSON.stringify(error.errors, null, 2));
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/places/:id/comments — Añade un comentario a un lugar.
 *
 * Usa `$push` para anexar el subdocumento y devuelve solo el comentario
 * recién creado (el último del arreglo) para que el frontend lo pinte.
 *
 * @param {import('express').Request}  req  `params.id`; cuerpo `{ username, text }`.
 * @param {import('express').Response} res  `201` con el comentario; `404` si no existe.
 */
export const addComment = async (req, res) => {
    try {
        const { username, text } = req.body;
        const place = await Place.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { username, text } } },
            { new: true }
        );
        if (!place) return res.status(404).json({ error: 'Lugar no encontrado' });
        const comment = place.comments[place.comments.length - 1];
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error añadiendo comentario:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/places/:id/archive — Archiva o restaura un lugar.
 *
 * Los lugares archivados se ocultan del feed y del mapa, pero siguen visibles
 * en el perfil del autor para poder gestionarlos. Si no se envía `archived`
 * en el cuerpo, por defecto archiva (true).
 *
 * @param {import('express').Request}  req  `params.id`; cuerpo `{ archived }`.
 * @param {import('express').Response} res  `200` con el documento actualizado.
 */
export const setArchived = async (req, res) => {
    try {
        const { archived } = req.body;
        const place = await Place.findByIdAndUpdate(
            req.params.id,
            { archived: archived === undefined ? true : !!archived },
            { new: true }
        );
        if (!place) return res.status(404).json({ error: 'Lugar no encontrado' });
        res.status(200).json(place);
    } catch (error) {
        console.error('Error archivando lugar:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/places/:id — Elimina un lugar de forma permanente.
 *
 * @param {import('express').Request}  req  `params.id` del lugar a borrar.
 * @param {import('express').Response} res  `200 { message, id }`; `404` si no existe.
 */
export const deletePlace = async (req, res) => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) return res.status(404).json({ error: 'Lugar no encontrado' });
        res.status(200).json({ message: 'Lugar eliminado', id: req.params.id });
    } catch (error) {
        console.error('Error eliminando lugar:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/places — Devuelve todos los lugares, del más reciente al más
 * antiguo. El filtrado de archivados ocurre en el frontend.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res  `200` con el arreglo de lugares.
 */
export const getPlaces = async (req, res) => {
    try {
        const places = await Place.find().sort({ createdAt: -1 });
        res.status(200).json(places);
    } catch (error) {
        console.error("Error obteniendo lugares:", error);
        res.status(500).json({ error: 'Error al obtener los lugares' });
    }
};