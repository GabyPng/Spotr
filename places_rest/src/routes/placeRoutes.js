import express from 'express';
import { createPlace, getPlaces } from '../controllers/placeController.js';

const router = express.Router();

// Rutas base: /api/places
router.post('/', createPlace);
router.get('/', getPlaces);

export default router;