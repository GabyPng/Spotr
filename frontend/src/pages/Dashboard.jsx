/**
 * Vista principal de la aplicación (ruta privada `/`).
 *
 * Orquesta el estado global de la pantalla: la lista de lugares, qué panel
 * está abierto (modal de publicar, notificaciones, perfil, drawer de detalle)
 * y la pestaña activa en móvil (feed vs. mapa). Carga los lugares una vez al
 * montar y los pasa, ya filtrados, al feed y al mapa.
 *
 * Layout: split view en escritorio (feed a la izquierda, mapa a la derecha);
 * en móvil se alterna con la barra inferior.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapView from '../components/MapView';
import PublishModal from '../components/PublishModal';
import PlaceDrawer from '../components/PlaceDrawer';
import NotificationsPanel from '../components/NotificationsPanel';
import ProfileView from '../components/ProfileView';

/** Lee el `username` desde el payload del JWT (sin verificar firma). */
const getUsername = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'Explorador';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'Explorador';
  } catch {
    return 'Explorador';
  }
};

/**
 * Botón de "me gusta" sobre las tarjetas del feed. Es un espejismo visual:
 * anima el corazón y un pequeño "burst", pero el estado no se persiste.
 */
const LikeButton = () => {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 500);
    }
    setLiked(prev => !prev);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md transition-transform active:scale-90"
      style={{ transform: burst ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <span
        className="material-symbols-outlined transition-colors duration-200"
        style={{
          fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0",
          color: liked ? '#ef4444' : '#9ca3af',
          fontSize: '20px',
          lineHeight: 1,
          display: 'block',
        }}
      >
        favorite
      </span>
    </button>
  );
};

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [drawerPlace, setDrawerPlace] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const username = getUsername();

  // Carga inicial de lugares desde el Gateway (una sola vez al montar)
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:5500/api/places', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlaces(data);
      } catch (error) {
        console.error('Error cargando lugares:', error);
      }
    };
    fetchPlaces();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Inserta el lugar recién publicado al inicio del feed sin recargar
  const handlePlaceAdded = (nuevoLugar) => {
    setPlaces(prev => [nuevoLugar, ...prev]);
  };

  /** Cabecera de autorización reutilizable para las mutaciones. */
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const handleArchivePlace = async (id, archived) => {
    try {
      const { data } = await axios.patch(
        `http://localhost:5500/api/places/${id}/archive`,
        { archived },
        authHeaders()
      );
      setPlaces(prev => prev.map(p => (p._id === id ? data : p)));
    } catch (error) {
      console.error('Error archivando lugar:', error);
      alert('No se pudo archivar el lugar.');
    }
  };

  const handleDeletePlace = async (id) => {
    try {
      await axios.delete(`http://localhost:5500/api/places/${id}`, authHeaders());
      setPlaces(prev => prev.filter(p => p._id !== id));
      if (selectedPlace?._id === id) setSelectedPlace(null);
      if (drawerPlace?._id === id) setDrawerPlace(null);
    } catch (error) {
      console.error('Error eliminando lugar:', error);
      alert('No se pudo eliminar el lugar.');
    }
  };

  // Los lugares archivados se ocultan del feed y del mapa, pero siguen en el perfil
  const visiblePlaces = places.filter(p => !p.archived);

  return (
    <div className="bg-background text-on-background h-screen overflow-hidden flex flex-col font-body relative">

      {/* ── TOP APP BAR ── */}
      <nav className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Spotr
        </h1>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <input
            type="text"
            placeholder="Buscar spots, tags, ciudades..."
            className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2"
          >
            <span>+</span> <span className="hidden sm:inline">Publicar Lugar</span>
          </button>

          {/* Notificaciones */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Perfil */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
            aria-label="Perfil"
          >
            {username?.[0]?.toUpperCase() || '?'}
          </button>
        </div>
      </nav>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <PublishModal
          onClose={() => setIsModalOpen(false)}
          onPlaceAdded={handlePlaceAdded}
        />
      )}

      {/* ── NOTIFICACIONES ── */}
      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      {/* ── PERFIL ── */}
      {showProfile && (
        <ProfileView
          username={username}
          places={places}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onArchive={handleArchivePlace}
          onDelete={handleDeletePlace}
        />
      )}

      {/* ── MAIN SPLIT VIEW ── */}
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT FEED — full width on mobile (hidden when map tab active) */}
        <section className={`${activeTab === 'map' ? 'hidden' : 'flex'} md:flex w-full md:w-[440px] lg:w-[500px] flex-col bg-[#f9f9f9] border-r border-gray-100 h-full`}>

          {/* Filter tabs */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {['Trending', 'Nearby', 'Cafes', 'Nature'].map((tab, i) => (
              <span
                key={tab}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap ${i === 0 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Feed real: fotos cuadradas de tamaño fijo, centradas, que se
              deslizan verticalmente conforme se publican más spots */}
          <div className="flex-1 overflow-y-auto feed-scroll p-4 md:p-6 flex flex-col items-center gap-6 pb-24 md:pb-6">
            {visiblePlaces.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center mt-12">No hay lugares todavía. ¡Publica el primero!</p>
            )}
            {visiblePlaces.map(place => (
              <article
                key={place._id}
                onClick={() => setSelectedPlace(place)}
                className="group relative aspect-square w-full max-w-[400px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
              >
                {place.imageUrl && (
                  <img
                    src={place.imageUrl}
                    alt={place.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <LikeButton />
              </article>
            ))}
          </div>
        </section>

        {/* RIGHT MAP — full width on mobile (hidden when explore tab active) */}
        <section className={`${activeTab === 'explore' ? 'hidden' : 'flex'} md:flex flex-1 relative bg-surface-container-lowest`}>
          <MapView
            places={visiblePlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            onOpenDrawer={setDrawerPlace}
          />
        </section>
      </main>

      {/* ── DRAWER DE DETALLE ── */}
      {/* A nivel raíz para que funcione tanto desde el feed como desde el
          mapa, en escritorio y en móvil (cubre toda la pantalla). */}
      {drawerPlace && (
        <PlaceDrawer place={drawerPlace} onClose={() => setDrawerPlace(null)} />
      )}

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="md:hidden bg-surface/90 backdrop-blur-xl shadow-[0_-4px_12px_0_rgba(0,0,0,0.05)] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t border-outline-variant/20">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center transition-opacity ${activeTab === 'explore' ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
        >
          <span className={`material-symbols-outlined ${activeTab === 'explore' ? 'filled-icon' : ''}`}>grid_view</span>
          <span className="text-[10px] font-bold tracking-wider mt-1">Explore</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center transition-opacity ${activeTab === 'map' ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}
        >
          <span className={`material-symbols-outlined ${activeTab === 'map' ? 'filled-icon' : ''}`}>map</span>
          <span className="text-[10px] font-bold tracking-wider mt-1">Map</span>
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-60"
        >
          <span className="material-symbols-outlined">add_box</span>
          <span className="text-[10px] font-bold tracking-wider mt-1">Post</span>
        </button>

        <button
          onClick={() => setShowNotifications(true)}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-60"
        >
          <span className="relative material-symbols-outlined">
            notifications
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-bold tracking-wider mt-1">Activity</span>
        </button>

        <button
          onClick={() => setShowProfile(true)}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-60"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold tracking-wider mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
