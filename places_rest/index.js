import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import placeRoutes from './src/routes/placeRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/places', placeRoutes);

// Conexión a Base de Datos y arranque del servidor
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