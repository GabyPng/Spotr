/**
 * Raíz de la aplicación: define el enrutado y la protección de rutas.
 *
 * Solo hay dos rutas:
 *   /login → pública (inicio de sesión / registro)
 *   /      → privada  (Dashboard; requiere un JWT en localStorage)
 *
 * La sesión se considera activa si existe `token` en localStorage. No se
 * valida la firma en el cliente: la verificación real la hace el API Gateway
 * en cada petición protegida.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

/**
 * Envuelve una ruta privada. Si no hay token guardado, redirige a /login.
 * @param {{ children: React.ReactNode }} props
 */
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Ruta privada (Requiere token) */}
        <Route 
          path="/" 
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;