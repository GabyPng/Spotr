import React from 'react';
import MapView from '../components/MapView';

const Dashboard = () => {
  // Función temporal para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f9f9f9] overflow-hidden font-sans">
      
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN */}
      <nav className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
        <h1 className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Spotr
        </h1>
        
        {/* Buscador central */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <input 
            type="text" 
            placeholder="Buscar spots, tags, ciudades..." 
            className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Botones derechos */}
        <div className="flex items-center gap-4">
          <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2">
            <span>+</span> Publicar Lugar
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
            Salir
          </button>
        </div>
      </nav>

      {/* 2. CONTENEDOR DIVIDIDO (SPLIT VIEW) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Lado Izquierdo: El Feed de lugares (Lista desplazable) */}
        <div className="w-full md:w-1/3 lg:w-2/5 h-full overflow-y-auto p-4 md:p-6 bg-[#f9f9f9]">
          
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold cursor-pointer">Trending</span>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer">Nearby</span>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer">Cafes</span>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer">Nature</span>
          </div>

          {/* Tarjeta de prueba temporal */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer mb-6">
            <div className="h-48 bg-gray-300 w-full relative">
              {/* Aquí irá la imagen de tu bd */}
              <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm">
                🤍
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans' }}>Café Lumina</h3>
              <p className="text-sm text-gray-500 mt-1">A 2 km de ti</p>
            </div>
          </div>
          
        </div>

        {/* Lado Derecho: El Mapa Interactivo */}
        <div className="hidden md:block md:w-2/3 lg:w-3/5 h-full bg-gray-200 relative">
          <MapView />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;