/**
 * Punto de entrada del frontend.
 *
 * Monta el árbol de React en el div #root de index.html. `index.css` importa
 * Tailwind; las animaciones globales y los estilos de Leaflet viven en el
 * <style> de index.html. StrictMode activa avisos de desarrollo de React.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Importa Tailwind (necesario para todas las clases utilitarias)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)