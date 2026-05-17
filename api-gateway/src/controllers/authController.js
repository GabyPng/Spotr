/**
 * Controlador de autenticación del API Gateway.
 *
 * Maneja el alta de usuarios (`register`) y el inicio de sesión (`login`).
 * Las contraseñas se almacenan siempre cifradas con bcrypt; el login devuelve
 * un JWT firmado con `JWT_SECRET` que el cliente envía en cada petición
 * protegida (cabecera `Authorization: Bearer <token>`).
 */

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * POST /auth/register
 * Crea un usuario nuevo con la contraseña cifrada (bcrypt, 10 salt rounds).
 *
 * @param {import('express').Request}  req  Espera `{ username, password }`.
 * @param {import('express').Response} res  `201` si se crea; `500` ante error.
 */
export const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
};

/**
 * POST /auth/login
 * Verifica las credenciales y, si son válidas, emite un JWT con 7 días de
 * vigencia que incluye `{ id, username }` en su payload.
 *
 * @param {import('express').Request}  req  Espera `{ username, password }`.
 * @param {import('express').Response} res  `200 { token }`; `404`/`401`/`500`.
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        // Mensajes distintos para usuario inexistente vs. contraseña errónea
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

        // El payload viaja firmado; el cliente lo decodifica para mostrar el nombre
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ token });
    } catch (error) {
        console.error("LOGIN ERROR:", error.message, error.stack);
        res.status(500).json({ error: "Error en el inicio de sesión", detalle: error.message });
    }
};