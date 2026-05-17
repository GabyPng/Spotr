/**
 * Panel desplegable de notificaciones (campana de la barra superior).
 *
 * Espejismo intencional para la demo: la lista es estática (`NOTIFICATIONS`)
 * y no hay backend de notificaciones. Su valor es mostrar el tono del
 * producto —spots guardados, comentarios, alertas de proximidad, curaduría—
 * con un diseño pulido. `STYLE` mapea cada tipo a su color de icono.
 */

import React, { useState, useEffect } from 'react';

// Datos de demostración: no provienen de ninguna API
const NOTIFICATIONS = [
  {
    id: 1,
    type: 'value',
    icon: 'bookmark_added',
    title: 'Mariana guardó tu spot',
    body: 'Guardó tu spot de Fresas con Crema para visitarlo después.',
    time: 'hace 5 min',
    unread: true,
  },
  {
    id: 2,
    type: 'value',
    icon: 'bookmark_added',
    title: 'A 3 personas les sirvió tu recomendación',
    body: 'Tu spot Mirador del Cerro fue guardado por la comunidad.',
    time: 'hace 1 h',
    unread: true,
  },
  {
    id: 3,
    type: 'comment',
    icon: 'chat_bubble',
    title: 'Diego comentó tu spot',
    body: '"¡Llegué al amanecer y la vista fue increíble! Gracias por el dato."',
    time: 'hace 3 h',
    unread: true,
  },
  {
    id: 4,
    type: 'proximity',
    icon: 'near_me',
    title: '¡Estás cerca de un spot en tendencia!',
    body: 'Estás a solo 2 km de un Spot en tendencia por La Loma. ¿Lo visitas?',
    time: 'hace 6 h',
    unread: false,
  },
  {
    id: 5,
    type: 'curated',
    icon: 'auto_awesome',
    title: 'Recomendación del fin de semana',
    body: 'El fin de semana se acerca. Descubre nuevos spots de naturaleza rumbo al Cerro de San Juan.',
    time: 'hace 1 d',
    unread: false,
  },
];

const STYLE = {
  value: { wrap: 'bg-emerald-50', icon: 'text-emerald-600' },
  comment: { wrap: 'bg-blue-50', icon: 'text-blue-600' },
  proximity: { wrap: 'bg-black', icon: 'text-white' },
  curated: { wrap: 'bg-amber-50', icon: 'text-amber-600' },
};

const NotificationsPanel = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-[55]" onClick={onClose} />

      <div
        className={`fixed top-[72px] right-3 md:right-6 z-[60] w-[380px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] border border-gray-100 overflow-hidden origin-top-right transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Notificaciones
          </h2>
          <button className="text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors">
            Marcar como leídas
          </button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar divide-y divide-gray-50">
          {NOTIFICATIONS.map(n => {
            const s = STYLE[n.type];
            return (
              <div
                key={n.id}
                className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  n.unread ? 'bg-gray-50/60' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.wrap}`}>
                  <span className={`material-symbols-outlined ${s.icon}`} style={{ fontSize: 20 }}>
                    {n.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-black shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors tracking-wide">
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
