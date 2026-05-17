/**
 * Pantalla de perfil a pantalla completa.
 *
 * Cabecera tipo "pasaporte" (avatar, nivel) y dos pestañas:
 *   · "Mis Spots"  — todos los lugares del usuario, incluidos los archivados,
 *                    con menú para archivar/restaurar o eliminar.
 *   · "Guardados"  — espejismo: reutiliza los spots reales no archivados como
 *                    si fueran una wishlist.
 *
 * Las estadísticas y el nivel son datos de demostración. Al tocar un spot se
 * abre el mismo PlaceDrawer que en el mapa.
 */

import React, { useState, useEffect } from 'react';
import PlaceDrawer from './PlaceDrawer';

// Estadísticas de demostración (no calculadas a partir de datos reales)
const STATS = [
  { value: '12', label: 'Spots descubiertos' },
  { value: '45', label: 'Guardados por la comunidad' },
  { value: '8', label: 'Ciudades exploradas' },
];

/**
 * Celda de la cuadrícula de spots. Si `manageable`, muestra el menú de
 * archivar/eliminar con confirmación en dos pasos para el borrado.
 */
const SpotTile = ({ place, onSelect, saved, manageable, onArchive, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isArchived = place.archived;

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
  };

  return (
    <div className="relative aspect-square overflow-hidden bg-gray-100 group">
      <button
        onClick={() => onSelect(place)}
        className="w-full h-full block"
      >
        {place.imageUrl && (
          <img
            src={place.imageUrl}
            alt={place.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isArchived ? 'grayscale opacity-50' : ''
            }`}
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-2">
          <span className="text-white text-[11px] font-semibold leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 text-left">
            {place.title}
          </span>
        </div>
      </button>

      {saved && (
        <span className="material-symbols-outlined filled-icon absolute top-2 right-2 text-white drop-shadow pointer-events-none" style={{ fontSize: 18 }}>
          bookmark
        </span>
      )}

      {isArchived && (
        <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full pointer-events-none">
          Archivado
        </span>
      )}

      {manageable && (
        <>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-900 shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Opciones"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeMenu} />
              <div className="absolute top-10 right-1.5 z-20 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden">
                <button
                  onClick={() => { onArchive(place._id, !isArchived); closeMenu(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-gray-500" style={{ fontSize: 18 }}>
                    {isArchived ? 'unarchive' : 'archive'}
                  </span>
                  {isArchived ? 'Restaurar' : 'Archivar'}
                </button>

                {confirmDelete ? (
                  <div className="flex items-center border-t border-gray-100">
                    <button
                      onClick={() => { onDelete(place._id); closeMenu(); }}
                      className="flex-1 px-3 py-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 px-3 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    Eliminar
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

/** Cuadrícula de 3 columnas; muestra un estado vacío si no hay items. */
const SpotGrid = ({ items, onSelect, emptyText, saved, manageable, onArchive, onDelete }) => {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
          {saved ? 'bookmark' : 'add_a_photo'}
        </span>
        <p className="text-sm text-gray-400 max-w-[240px]">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-1.5">
      {items.map(place => (
        <SpotTile
          key={place._id}
          place={place}
          onSelect={onSelect}
          saved={saved}
          manageable={manageable}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const ProfileView = ({ username, places = [], onClose, onLogout, onArchive, onDelete }) => {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState('spots');
  const [drawerPlace, setDrawerPlace] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // "Mis Spots" muestra todo (incluido lo archivado, para poder gestionarlo).
  // "Guardados" es un espejismo: reutiliza spots reales no archivados.
  const savedPlaces = [...places].filter(p => !p.archived).reverse();
  const gridItems = tab === 'spots' ? places : savedPlaces;

  return (
    <div
      className={`fixed inset-0 z-[60] bg-[#f9f9f9] flex flex-col transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top bar */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Mi Perfil
        </h1>
        <button
          onClick={onLogout}
          className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
        >
          Salir
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto feed-scroll">
        {/* Passport header */}
        <div className="bg-white border-b border-gray-100 px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {username?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            {username}
          </h2>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined filled-icon" style={{ fontSize: 14 }}>hiking</span>
            Nivel: Explorador Local
          </div>

          {/* Stats */}
          <div className="flex items-stretch gap-2 mt-7 w-full max-w-md">
            {STATS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center px-2 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {s.value}
                </span>
                <span className="text-[11px] text-gray-500 leading-tight mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white sticky top-0 z-10 flex border-b border-gray-100">
          {[
            { id: 'spots', label: 'Mis Spots', icon: 'grid_view' },
            { id: 'saved', label: 'Guardados', icon: 'bookmark' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors relative ${
                tab === t.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`material-symbols-outlined ${tab === t.id ? 'filled-icon' : ''}`} style={{ fontSize: 20 }}>
                {t.icon}
              </span>
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="p-1 md:p-1.5 pb-12">
          <SpotGrid
            items={gridItems}
            onSelect={setDrawerPlace}
            saved={tab === 'saved'}
            manageable={tab === 'spots'}
            onArchive={onArchive}
            onDelete={onDelete}
            emptyText={
              tab === 'spots'
                ? 'Aún no has publicado spots. ¡Comparte tu primer lugar secreto!'
                : 'No has guardado spots todavía. Explora y guarda los lugares que quieres visitar.'
            }
          />
        </div>
      </div>

      {/* Detail drawer (mismo modal del mapa) */}
      {drawerPlace && (
        <PlaceDrawer place={drawerPlace} onClose={() => setDrawerPlace(null)} />
      )}
    </div>
  );
};

export default ProfileView;
