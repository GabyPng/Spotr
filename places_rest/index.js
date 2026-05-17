/**
 * Spotr · Microservicio REST de lugares (places_rest)
 * ---------------------------------------------------------------------------
 * Servidor Express interno (puerto 4000). No es público: solo recibe tráfico
 * reenviado por el API Gateway, que ya validó el JWT. Expone el CRUD de
 * lugares bajo `/api/places` y persiste en la colección `places` de MongoDB.
 *
 * Variable de entorno: MONGO_URI (ver .env.example).
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import placeRoutes from './src/routes/placeRoutes.js';

// Carga MONGO_URI (y PORT opcional) desde el archivo .env
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/places', placeRoutes);

// Conexión a Base de Datos y arranque del servidor.
// El servidor solo escucha si la conexión a MongoDB tiene éxito.
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Conectado exitosamente a MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Microservicio REST de Lugares corriendo en el puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error conectando a MongoDB Atlas:', err.message);
    });