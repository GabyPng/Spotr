/**
 * Mapa interactivo con los lugares (panel derecho del Dashboard).
 *
 * Usa React-Leaflet con tiles de CARTO. Cada lugar es un `Marker` con un pin
 * SVG coloreado según `pinColor` y un `Popup` con miniatura y acceso al
 * detalle. Centrado por defecto en Tepic. Sub-componentes internos:
 *
 *   · ZoomControls — botones de geolocalización y zoom (fuera del default).
 *   · FlyToPlace   — al seleccionar un lugar, vuela a él y abre su popup.
 *
 * Recibe del Dashboard la lista ya filtrada y los callbacks de selección.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet por defecto resuelve mal las imágenes del marcador con bundlers;
// se fuerzan las URLs absolutas del CDN.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Pin SVG coloreado segun el color elegido al publicar el lugar.
// Se cachea por color para no recrear el divIcon en cada render.
const iconCache = {};
const getPinIcon = (color = '#1b1b1b') => {
  if (iconCache[color]) return iconCache[color];
  const icon = L.divIcon({
    className: 'spotr-pin',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <path d="M15 0C6.72 0 0 6.72 0 15c0 10.31 15 25 15 25s15-14.69 15-25C30 6.72 23.28 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
  iconCache[color] = icon;
  return icon;
};

const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute right-8 top-8 flex flex-col gap-3 z-[999] pointer-events-auto">
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 15 })}
        className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-all active:scale-95"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>
      <div className="flex flex-col bg-white rounded-full shadow-lg overflow-hidden mt-2">
        <button
          onClick={() => map.zoomIn()}
          className="w-12 h-12 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors border-b border-outline-variant/30"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="w-12 h-12 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
    </div>
  );
};

// Vuela al lugar seleccionado y abre su popup al terminar la animación
const FlyToPlace = ({ place, markerRefs }) => {
  const map = useMap();
  useEffect(() => {
    if (!place) return;
    const [lng, lat] = place.location.coordinates;
    const marker = markerRefs.current[place._id];

    const openPopup = () => {
      // Quitar clase closing antes de abrir por si quedó del cierre anterior
      const popupEl = document.querySelector('.spotr-popup');
      if (popupEl) popupEl.classList.remove('closing');
      if (marker) marker.openPopup();
    };

    map.once('moveend', openPopup);
    map.flyTo([lat, lng], 15, { duration: 0.8 });

    // Fallback por si moveend no dispara (ej. ya estaba en esa posición)
    const fallback = setTimeout(openPopup, 900);

    return () => {
      map.off('moveend', openPopup);
      clearTimeout(fallback);
    };
  }, [place]);
  return null;
};

const MapView = ({ places = [], selectedPlace, onSelectPlace, onOpenDrawer }) => {
  const tepicCoords = [21.5095, -104.8957];
  const markerRefs = useRef({});

  const setMarkerRef = useCallback((id, el) => {
    if (el) markerRefs.current[id] = el;
  }, []);

  const handleClose = (placeId) => {
    const popupEl = document.querySelector('.spotr-popup');
    if (popupEl) {
      popupEl.classList.add('closing');
      setTimeout(() => {
        markerRefs.current[placeId]?.closePopup();
        onSelectPlace(null);
        // Limpiar la clase para que la próxima apertura empiece limpia
        popupEl.classList.remove('closing');
      }, 200);
    } else {
      onSelectPlace(null);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={tepicCoords}
        zoom={13}
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <ZoomControls />
        <FlyToPlace place={selectedPlace} markerRefs={markerRefs} />

        {places.map(place => {
          const [lng, lat] = place.location.coordinates;
          return (
            <Marker
              key={place._id}
              position={[lat, lng]}
              icon={getPinIcon(place.pinColor)}
              ref={el => setMarkerRef(place._id, el)}
              eventHandlers={{
                click: () => {
                  const popupEl = document.querySelector('.spotr-popup');
                  if (popupEl) popupEl.classList.remove('closing');
                  onSelectPlace(place);
                }
              }}
            >
              <Popup className="spotr-popup">
                <div className="relative">
                  {/* Image 16:9 */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                    {place.imageUrl && (
                      <img src={place.imageUrl} alt={place.title} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => handleClose(place._id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                        {place.title}
                      </h3>
                      <div className="flex items-center gap-0.5 text-black">
                        <span className="material-symbols-outlined filled-icon" style={{ fontSize: 14 }}>star</span>
                        <span className="text-[10px] font-bold tracking-wider">4.8</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{place.description}</p>
                    <button
                      onClick={() => { handleClose(place._id); onOpenDrawer(place); }}
                      className="w-full bg-black text-white py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Ver detalles
                    </button>
                  </div>

                  {/* Arrow tip */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
