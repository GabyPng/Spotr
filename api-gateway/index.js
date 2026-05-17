/**
 * Spotr · API Gateway
 * ---------------------------------------------------------------------------
 * Punto único de entrada de la plataforma (puerto 5500). El frontend solo
 * conoce este servicio; nunca habla con los microservicios directamente.
 *
 * Responsabilidades:
 *   1. Autenticación: registro, login y emisión de JWT.
 *   2. Verificación del JWT en todas las rutas protegidas.
 *   3. Subida de imágenes a Cloudinary (`/api/upload`).
 *   4. Proxy REST     → places_rest  (http://localhost:4000)  vía Axios.
 *   5. Proxy GraphQL  → maps_graphql (http://localhost:4001)  vía Axios.
 *
 * Variables de entorno: MONGO_URI, JWT_SECRET, CLOUDINARY_* (ver .env.example).
 * ---------------------------------------------------------------------------
 */

// ============================================================================
// ARCHIVO PRINCIPAL: API GATEWAY
// Propósito: Actuar como el punto único de entrada para todas las peticiones
// del cliente (Frontend). Este servicio centraliza el enrutamiento, gestiona 
// la seguridad mediante autenticación JWT y se comunica con los microservicios 
// internos (REST y GraphQL) utilizando Axios.
// ============================================================================

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

import { register, login } from './src/controllers/authController.js';
import { verificarToken } from './src/middleware/authMiddleware.js';

// Cargar variables de entorno (ej. puertos, secretos JWT, URI de base de datos)
dotenv.config();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// URLs de los microservicios internos. Configurables por entorno para que
// funcione tanto en local (localhost) como en Docker (nombre del servicio).
const PLACES_SERVICE_URL = process.env.PLACES_SERVICE_URL || 'http://localhost:4000';
const MAPS_SERVICE_URL   = process.env.MAPS_SERVICE_URL   || 'http://localhost:4001';

// Multer — memoria RAM (no guarda en disco)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// CONEXIÓN A BASE DE DATOS (EXCLUSIVA PARA AUTENTICACIÓN)
// El Gateway se conecta a MongoDB Atlas únicamente para validar credenciales.
// La gestión de lugares y mapas ocurre en sus respectivos microservicios.
// ============================================================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('API Gateway: Conexión exitosa a MongoDB Atlas (AuthDB)'))
    .catch(err => console.error('Error conectando a MongoDB en Gateway:', err));

// ============================================================================
// RUTAS PÚBLICAS: AUTENTICACIÓN Y GENERACIÓN DE JWT
// Estas rutas no están protegidas ya que su propósito es identificar al usuario.
// ============================================================================
app.post('/auth/register', register);
app.post('/auth/login', login);

// ============================================================================
// UPLOAD DE IMAGEN → CLOUDINARY
// Recibe un archivo (multipart/form-data), lo sube a Cloudinary y devuelve la URL.
// ============================================================================
app.post('/api/upload', verificarToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

        // Subir buffer a Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'spotr', resource_type: 'image' },
                (error, result) => error ? reject(error) : resolve(result)
            );
            stream.end(req.file.buffer);
        });

        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen.' });
    }
});

// ============================================================================
// ENRUTAMIENTO REST (MICROSERVICIO 1: PUBLICACIÓN DE LUGARES)
// Intercepta las peticiones que van a /api/places, verifica el token JWT y, 
// si es válido, usa Axios para redirigir la petición al microservicio REST.
// ============================================================================
app.use('/api/places', verificarToken, async (req, res) => {
    try {
        // Redirección de la petición HTTP original hacia el microservicio REST (Puerto 4000)
        const response = await axios({
            method: req.method, // Respeta si es GET, POST, PUT, DELETE
            url: `${PLACES_SERVICE_URL}/api/places${req.url}`,
            data: req.body,     // Pasa el cuerpo de la petición (ej. datos de un nuevo lugar)
            headers: { 'Content-Type': 'application/json' } // Solo el header necesario
        });
        // Devuelve al cliente la respuesta exacta del microservicio
        res.status(response.status).json(response.data);
    } catch (error) {
        // Manejo de errores si el microservicio REST está caído o falla
        res.status(error.response?.status || 500).json(error.response?.data || { error: "Error de comunicación con el MS REST" });
    }
});

// ============================================================================
// ENRUTAMIENTO GRAPHQL (MICROSERVICIO 2: MAPAS Y UBICACIÓN)
// Define el esquema público que verá el cliente y resuelve las peticiones
// consultando internamente al microservicio GraphQL real vía Axios.
// ============================================================================

// 1. Definición de Tipos (Schema): Lo que el Frontend puede pedir
const typeDefs = `#graphql
  type PlaceLocation { 
      id: ID!
      title: String!
      lat: Float
      lng: Float 
  }
  type Query { 
      mapLocations: [PlaceLocation] 
  }
`;

// 2. Resolvers: La lógica que busca la información cuando el cliente hace una Query
const resolvers = {
    Query: {
        mapLocations: async () => {
            // El Gateway hace una petición POST por Axios al verdadero MS GraphQL (Puerto 4001)
            const response = await axios.post(`${MAPS_SERVICE_URL}/graphql`, {
                query: `query { locations { id title lat lng } }`
            });
            // Extrae la data de la respuesta anidada típica de GraphQL y la devuelve al cliente
            return response.data.data.locations;
        }
    }
};

// 3. Inicialización del Servidor Apollo para el Gateway
const server = new ApolloServer({ typeDefs, resolvers });

// Iniciamos Apollo Server antes de conectarlo con Express
await server.start();

// Montamos la ruta de GraphQL y la protegemos con el middleware JWT
app.use('/graphql', verificarToken, expressMiddleware(server));

// ============================================================================
// ARRANQUE DEL API GATEWAY
// ============================================================================
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`API Gateway centralizado y ejecutándose en el puerto ${PORT}`);
    console.log(`Autenticación disponible en: http://localhost:${PORT}/auth/login`);
    console.log(`Place REST protegida en: http://localhost:${PORT}/api/places`);
    console.log(`Maps GraphQL protegida en: http://localhost:${PORT}/graphql`);
    console.log(`========================================================`);
});