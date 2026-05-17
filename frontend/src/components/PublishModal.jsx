/**
 * Modal para publicar un nuevo lugar.
 *
 * Flujo de imagen: el usuario sube un archivo (drag & drop o explorador) que
 * va a `POST /api/upload` (Cloudinary) o pega una URL directa. Luego completa
 * título, descripción, color de pin, ubicación (clic en el mini-mapa), mejor
 * hora y etiquetas, y envía `POST /api/places`. Al crear, llama
 * `onPlaceAdded(data)` para refrescar el feed y cierra el modal.
 *
 * Si el token expiró (401/403), limpia la sesión y manda a /login.
 */

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

/** Pin arrastrable: actualiza la posición al hacer clic en el mapa. */
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return position === null ? null : <Marker position={position} />;
};

// Paleta acorde a la temática minimalista de Spotr: tonos sobrios y nítidos
const PIN_COLORS = [
  { name: 'Negro',     value: '#1b1b1b' },
  { name: 'Azul',      value: '#2196f3' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Ámbar',     value: '#f59e0b' },
  { name: 'Rojo',      value: '#ef4444' },
  { name: 'Violeta',   value: '#8b5cf6' },
  { name: 'Rosa',      value: '#ec4899' },
  { name: 'Turquesa',  value: '#14b8a6' },
];

const PublishModal = ({ onClose, onPlaceAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [position, setPosition] = useState([21.5095, -104.8957]);
  const [bestTime, setBestTime] = useState('');
  const [pinColor, setPinColor] = useState(PIN_COLORS[0].value);
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!colorOpen) return;
    const handleClickOutside = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) setColorOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorOpen]);

  // La imagen es obligatoria: en cuanto haya una, limpia el mensaje de error
  useEffect(() => {
    if (imageUrl) setImageError('');
  }, [imageUrl]);

  /** Sube un archivo de imagen al Gateway y guarda la URL de Cloudinary. */
  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5500/api/upload', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImageUrl(data.url);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!tags.includes(newTag)) setTags(prev => [...prev, newTag]);
      setTagInput('');
    }
  };

  /**
   * Envía el lugar al Gateway. La imagen es OBLIGATORIA: si no hay `imageUrl`
   * (subida o pegada por URL) se bloquea el envío y se muestra el error.
   * `tags` cae a una etiqueta por defecto; la posición se manda como lat/lng.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación: no se puede publicar un lugar sin imagen
    if (!imageUrl) {
      setImageError('Agrega una imagen para publicar el lugar.');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.post(
        'http://localhost:5500/api/places',
        {
          author: getUsername(),
          title,
          description,
          imageUrl,
          tags: tags.length > 0 ? tags : ['#nuevo'],
          bestTime,
          pinColor,
          lat: position[0],
          lng: position[1],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onPlaceAdded(data);
      onClose();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        localStorage.removeItem('token');
        alert('Tu sesión expiró.');
        window.location.href = '/login';
        return;
      }
      alert('Error al publicar el lugar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] w-full max-w-[640px] flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>Sube un lugar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form id="publish-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-8 flex-grow">

          {/* Image upload (obligatoria) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Imagen <span className="text-red-500">*</span>
            </label>
            {imageUrl ? (
              <div className="relative w-full h-[240px] rounded-lg overflow-hidden">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`w-full h-[240px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${dragging
                    ? 'border-black bg-gray-100'
                    : imageError
                      ? 'border-red-400 bg-red-50 hover:bg-red-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
                  ${uploading ? 'pointer-events-none' : ''}`}
              >
                {uploading ? (
                  <>
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Subiendo imagen...</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-3">photo_camera</span>
                    <p className="font-semibold text-gray-600 mb-1">Arrastra una imagen aquí</p>
                    <p className="text-sm text-gray-400">o haz clic para explorar tus archivos</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {imageError && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {imageError}
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-grow h-px bg-gray-200" />
              <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">O</span>
              <div className="flex-grow h-px bg-gray-200" />
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pega el enlace de la imagen aquí..."
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => { if (imageInput.trim()) { setImageUrl(imageInput.trim()); setImageInput(''); } }}
                className="bg-black text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-5">
              <input
                type="text"
                placeholder="Añade un título llamativo..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="flex-1 min-w-0 bg-transparent border-0 border-b border-gray-200 px-0 py-3 text-xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
                style={{ fontFamily: 'Plus Jakarta Sans' }}
              />
              {/* Pin color picker */}
              <div ref={colorRef} className="relative shrink-0 pb-1.5">
                <button
                  type="button"
                  onClick={() => setColorOpen(o => !o)}
                  title="Color del pin"
                  aria-label="Elegir color del pin"
                  className="flex items-center gap-1 p-1.5 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="material-symbols-outlined filled-icon text-[26px] leading-none"
                    style={{ color: pinColor }}
                  >
                    location_on
                  </span>
                  <span
                    className={`material-symbols-outlined text-[16px] text-gray-400 transition-transform ${colorOpen ? 'rotate-180' : ''}`}
                  >
                    expand_more
                  </span>
                </button>

                {colorOpen && (
                  <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-gray-100 p-3 w-max">
                    <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2.5">
                      Color del pin
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {PIN_COLORS.map(({ name, value }) => (
                        <button
                          key={value}
                          type="button"
                          title={name}
                          aria-label={`Color del pin: ${name}`}
                          onClick={() => { setPinColor(value); setColorOpen(false); }}
                          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                            pinColor === value
                              ? 'bg-gray-100 ring-2 ring-gray-900'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined filled-icon text-[28px] leading-none transition-transform hover:scale-110"
                            style={{ color: value }}
                          >
                            location_on
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <textarea
              placeholder="Describe qué hace especial a este lugar. ¿Cómo es la luz? ¿Cuál es el mejor encuadre?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full bg-transparent border-0 border-b border-gray-200 px-0 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 resize-none transition-colors"
            />
          </div>

          {/* Map */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">pin_drop</span>
              Ubicación exacta
            </label>
            <div className="relative w-full h-[180px] rounded-lg overflow-hidden border border-gray-200">
              <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
              <p className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
                Toca el mapa para mover el pin
              </p>
            </div>
          </div>

          {/* Best time */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">wb_twilight</span>
              Mejor hora para visitar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'Amanecer (6–8am)', icon: 'flare' },
                { value: 'Mañana (8am–12pm)', icon: 'wb_sunny' },
                { value: 'Mediodía (12–3pm)', icon: 'light_mode' },
                { value: 'Hora dorada (5–7pm)', icon: 'wb_twilight' },
                { value: 'Noche', icon: 'nightlight' },
                { value: 'Cualquier hora', icon: 'schedule' },
              ].map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBestTime(prev => prev === value ? '' : value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                    bestTime === value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">sell</span>
              Etiquetas
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="hover:text-black transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Añadir etiqueta y presionar Enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-white sticky bottom-0 z-10">
          <button
            type="submit"
            form="publish-form"
            disabled={loading || uploading || !imageUrl}
            className="w-full bg-black text-white font-semibold text-sm px-8 py-3.5 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 flex justify-center items-center gap-2"
          >
            {loading ? 'Publicando...' : (
              <>Publicar Lugar <span className="material-symbols-outlined text-[20px]">publish</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PublishModal;
