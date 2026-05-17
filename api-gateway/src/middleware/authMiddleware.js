/**
 * Middleware de verificación de JWT.
 *
 * Se monta delante de toda ruta protegida del Gateway (`/api/places`,
 * `/api/upload`, `/graphql`). Lee la cabecera `Authorization`, acepta el
 * formato `Bearer <token>` o el token pelado, lo verifica con `JWT_SECRET`
 * y, si es válido, adjunta el payload decodificado a `req.user`.
 *
 * Respuestas de error: `401` si falta el token, `403` si es inválido/expirado.
 */

import jwt from 'jsonwebtoken';

/** @type {import('express').RequestHandler} */
export const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere un token.' });
    }

    try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verificado;
        next();
    } catch (error) {
        console.error('JWT ERROR:', error.name, '-', error.message);
        console.error('Token recibido:', authHeader?.slice(0, 30) + '...');
        res.status(403).json({ error: 'Token inválido o expirado', detalle: error.message });
    }
};