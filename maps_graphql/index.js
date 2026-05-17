/**
 * Spotr · Microservicio GraphQL de mapas (maps_graphql)
 * ---------------------------------------------------------------------------
 * Servidor Apollo interno (puerto 4001). No es público: el API Gateway le
 * reenvía las queries de mapa. Solo expone la query `locations`, que lee la
 * colección `places` (compartida con places_rest) proyectando únicamente
 * título y coordenadas para minimizar el tráfico que pinta el mapa.
 *
 * El servidor solo arranca si la conexión a MongoDB tiene éxito.
 * Variable de entorno: MONGO_URI (ver .env.example).
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { typeDefs } from './src/graphql/typeDefs.js';
import { resolvers } from './src/graphql/resolvers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 MS GraphQL: Conectado exitosamente a MongoDB Atlas');

        await server.start();

        app.use(
            '/graphql',
            cors(),
            express.json(),
            expressMiddleware(server)
        );

        app.listen(PORT, () => {
            console.log(`Mapas corriendo en http://localhost:${PORT}/graphql`);
        });

    } catch (error) {
        console.error('Error al inicializar el servidor GraphQL:', error);
    }
};

startServer();