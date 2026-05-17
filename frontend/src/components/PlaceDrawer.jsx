/**
 * Drawer lateral con el detalle de un lugar.
 *
 * Se desliza desde la derecha (animación con `visible`) y muestra imagen,
 * etiquetas, descripción, mejor hora, un mini-mapa fijo y los comentarios.
 * Los comentarios sí se persisten: `POST /api/places/:id/comments`. El botón
 * "Cómo llegar" abre Google Maps con la ruta al destino. Se usa tanto desde
 * el mapa (Dashboard) como desde el perfil (ProfileView).
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Mismas correcciones de iconos de Leaflet que en MapView
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Decode JWT payload without verifying (display only)
const getUsername = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'Tú';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'Tú';
  } catch {
    return 'Tú';
  }
};

/** Formatea una fecha como tiempo relativo en español ("hace 5 min"). */
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'ahora mismo';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

const PlaceDrawer = ({ place, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [comments, setComments] = useState(place.comments || []);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (place) requestAnimationFrame(() => setVisible(true));
  }, [place]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  /** Envía un comentario y lo añade a la lista local de forma optimista. */
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `http://localhost:5500/api/places/${place._id}/comments`,
        { username: getUsername(), text: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [...prev, data]);
      setCommentText('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error enviando comentario:', err);
    } finally {
      setSending(false);
    }
  };

  if (!place) return null;

  // GeoJSON guarda [longitud, latitud]; Google Maps espera "lat,lng"
  const [lng, lat] = place.location.coordinates;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/30 z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer */}
      <aside
        className={`absolute inset-y-0 right-0 z-50 w-full md:w-[480px] lg:w-[540px] bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 shadow-sm hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">

          {/* Image */}
          <div className="relative w-full h-[320px] md:h-[400px] bg-gray-200 shrink-0">
            {place.imageUrl
              ? <img src={place.imageUrl} alt={place.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-5xl">image</span></div>
            }
          </div>

          {/* Body */}
          <div className="px-6 md:px-10 pt-6 flex flex-col gap-6">

            {/* Tags + Title + Favorite */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {place.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {place.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {tag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {place.title}
                </h1>
              </div>
              <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-200 transition-colors shrink-0">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed">{place.description}</p>

            {/* Best time card */}
            {place.bestTime && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-sm shrink-0">
                  <span className="material-symbols-outlined filled-icon">wb_twilight</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Mejor hora para visitar</p>
                  <p className="text-sm font-semibold text-gray-900">{place.bestTime}</p>
                </div>
              </div>
            )}

            {/* Mini map */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">location_on</span>
                <h3 className="text-sm font-semibold text-gray-900">Ubicación</h3>
              </div>
              <div className="w-full h-48 rounded-xl overflow-hidden relative border border-gray-100">
                <MapContainer center={[lat, lng]} zoom={15} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                  <Marker position={[lat, lng]} />
                </MapContainer>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 hover:bg-white transition-colors">
                  <span className="text-[11px] font-bold text-gray-900">Abrir mapa</span>
                  <span className="material-symbols-outlined text-gray-900" style={{ fontSize: 14 }}>open_in_new</span>
                </a>
              </div>
              <p className="text-sm text-gray-400 mt-2">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>

            {/* ── COMMENTS ── */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">chat_bubble</span>
                <h3 className="text-sm font-semibold text-gray-900">Comentarios</h3>
                {comments.length > 0 && (
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{comments.length}</span>
                )}
              </div>

              {/* Comment list */}
              <div className="flex flex-col gap-5">
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Sé el primero en comentar este lugar.</p>
                )}
                {comments.map((c, i) => (
                  <div key={c._id || i} className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {c.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{c.username}</span>
                        <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment input */}
              <form onSubmit={handleSendComment} className="flex gap-3 mt-6 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
                  {getUsername()[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-gray-900 transition-colors">
                  <input
                    type="text"
                    placeholder="Añade un comentario..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || sending}
                    className="text-gray-900 disabled:text-gray-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>

        {/* Sticky footer */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="w-full bg-black text-white font-semibold text-sm py-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">directions</span>
            Cómo llegar
          </a>
        </div>
      </aside>
    </>
  );
};

export default PlaceDrawer;
