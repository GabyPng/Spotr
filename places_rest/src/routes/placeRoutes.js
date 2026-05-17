/**
 * Rutas REST de lugares — montadas en `/api/places` (ver index.js).
 *
 * El API Gateway reenvía aquí las peticiones ya autenticadas, conservando
 * método y cuerpo. Cada ruta delega en su handler de placeController.
 */

import express from 'express';
import { createPlace, getPlaces, addComment, setArchived, deletePlace } from '../controllers/placeController.js';

const router = express.Router();

router.post('/', createPlace);                 // Crear un lugar
router.get('/', getPlaces);                    // Listar todos los lugares (más reciente primero)
router.post('/:id/comments', addComment);      // Añadir un comentario a un lugar
router.patch('/:id/archive', setArchived);     // Archivar / restaurar un lugar
router.delete('/:id', deletePlace);            // Eliminar un lugar permanentemente

export default router;