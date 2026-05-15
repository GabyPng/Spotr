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

// Importación de controladores y middlewares personalizados
import { register, login } from './src/controllers/authController.js';
import { verificarToken } from './src/middleware/authMiddleware.js';

// Cargar variables de entorno (ej. puertos, secretos JWT, URI de base de datos)
dotenv.config();

const app = express();

// ============================================================================
// CONFIGURACIÓN DE MIDDLEWARES GLOBALES
// ============================================================================
app.use(cors()); // Permite peticiones desde el navegador (Frontend)
app.use(express.json()); // Permite al servidor entender cuerpos de petición en formato JSON

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
app.post('/auth/register', register); // Crea un nuevo usuario en la base de datos
app.post('/auth/login', login);       // Valida credenciales y devuelve un token JWT

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
            url: `http://localhost:4000/api/places${req.url}`,
            data: req.body,     // Pasa el cuerpo de la petición (ej. datos de un nuevo lugar)
            headers: { ...req.headers, host: undefined } // Pasa los headers originales
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
            const response = await axios.post('http://localhost:4001/graphql', {
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