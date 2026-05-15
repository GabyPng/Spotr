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