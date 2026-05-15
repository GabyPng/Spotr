import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // ¡Muy importante para que no se vea roto!

const MapView = () => {
  // Coordenadas de Tepic (puedes ajustarlas al centro exacto que prefieras)
  const tepicCoords = [21.5095, -104.8957];

  return (
    // z-0 asegura que el mapa se quede al fondo y no tape tus menús desplegables
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={tepicCoords} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Un pin de prueba para ver que funcione */}
        <Marker position={tepicCoords}>
          <Popup>
            <div className="text-center font-semibold font-sans">
              ¡El centro de Tepic! 📍
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;