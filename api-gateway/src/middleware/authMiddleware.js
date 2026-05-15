import jwt from 'jsonwebtoken';

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
        res.status(403).json({ error: 'Token inválido o expirado' });
    }
};