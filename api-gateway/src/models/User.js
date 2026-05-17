/**
 * Modelo Mongoose `User` (colección `users`).
 *
 * Solo guarda credenciales: el `username` es único y la `password` se
 * almacena siempre como hash bcrypt (el cifrado ocurre en authController,
 * nunca aquí). Sin datos de perfil porque el frontend deriva el nombre
 * mostrado directamente del payload del JWT.
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // identificador de login
    password: { type: String, required: true }                // hash bcrypt, nunca texto plano
});

export default mongoose.model('User', userSchema);