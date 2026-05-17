/**
 * Pantalla de autenticación (ruta pública `/login`).
 *
 * Un único formulario alterna entre "Iniciar Sesión" y "Crear Cuenta" con un
 * control segmentado animado. Al hacer login guarda el JWT en localStorage y
 * navega a `/`; al registrarse muestra una confirmación y vuelve al modo
 * login. Todo el panel izquierdo (auroras, órbitas, iconos flotantes) es
 * puramente decorativo; las animaciones se definen en index.html.
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Iconos decorativos del panel de marca (colocados lejos del titular central)
const DECOR_ICONS = [
  { icon: 'location_on',    pos: { top: '14%', right: '20%' }, size: 58, anim: 'animate-floaty', delay: '0s',   op: 'text-white/20' },
  { icon: 'photo_camera',   pos: { top: '30%', right: '8%' },  size: 36, anim: 'animate-drift',  delay: '1.2s', op: 'text-white/15' },
  { icon: 'local_cafe',     pos: { top: '9%',  right: '40%' }, size: 28, anim: 'animate-floaty', delay: '2.4s', op: 'text-white/12' },
  { icon: 'restaurant',     pos: { bottom: '30%', right: '14%' }, size: 34, anim: 'animate-drift',  delay: '0.6s', op: 'text-white/15' },
  { icon: 'hiking',         pos: { bottom: '14%', right: '26%' }, size: 44, anim: 'animate-floaty', delay: '1.8s', op: 'text-white/18' },
  { icon: 'favorite',       pos: { top: '46%', right: '11%' }, size: 26, anim: 'animate-floaty', delay: '3s',   op: 'text-white/12' },
  { icon: 'terrain',        pos: { bottom: '40%', right: '34%' }, size: 30, anim: 'animate-drift',  delay: '2s',   op: 'text-white/10' },
  { icon: 'near_me',        pos: { top: '7%',  right: '9%' },  size: 24, anim: 'animate-floaty', delay: '1s',   op: 'text-white/15' },
  { icon: 'explore',        pos: { bottom: '24%', left: '15%' }, size: 38, anim: 'animate-drift',  delay: '2.6s', op: 'text-white/12' },
  { icon: 'travel_explore', pos: { bottom: '9%',  right: '7%' }, size: 28, anim: 'animate-floaty', delay: '0.4s', op: 'text-white/12' },
];

const DOTS = [
  { top: '20%', right: '32%', s: 7,  d: '0s' },
  { top: '38%', right: '24%', s: 5,  d: '1s' },
  { top: '60%', right: '16%', s: 8,  d: '0.5s' },
  { bottom: '22%', right: '40%', s: 6, d: '1.6s' },
  { top: '12%', right: '50%', s: 5,  d: '2.2s' },
  { bottom: '38%', right: '12%', s: 7, d: '0.8s' },
];

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
  };

  /**
   * Envía credenciales al Gateway. En login guarda el token y entra; en
   * registro muestra el estado de éxito y regresa al formulario de login.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const { data } = await axios.post(`http://localhost:5500${endpoint}`, {
        username,
        password,
      });

      if (isLogin) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsLogin(true);
          setPassword('');
        }, 1600);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f9f9f9] overflow-hidden">

      {/* ── BRANDING PANEL (desktop) ── */}
      <div className="hidden lg:flex w-1/2 relative bg-black text-white flex-col justify-between p-14 overflow-hidden">
        {/* Animated monochrome aurora */}
        <div className="absolute top-[-10%] left-[-5%] w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl animate-blob" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[480px] h-[480px] rounded-full bg-white/[0.07] blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-white/[0.05] blur-3xl animate-blob" style={{ animationDelay: '8s' }} />

        {/* Slow rotating orbit ring */}
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/[0.06] animate-spin-slow">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30" />
          <span className="absolute bottom-8 right-10 w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-white/[0.05] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '34s' }} />

        {/* Twinkling dots */}
        {DOTS.map((d, i) => (
          <span
            key={`dot-${i}`}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{ ...d, width: d.s, height: d.s, animationDelay: d.d }}
          />
        ))}

        {/* Floating themed icons */}
        {DECOR_ICONS.map((d, i) => (
          <span
            key={`ic-${i}`}
            className={`material-symbols-outlined absolute ${d.op} ${d.anim}`}
            style={{ ...d.pos, fontSize: d.size, animationDelay: d.delay }}
          >
            {d.icon}
          </span>
        ))}

        <div className="relative z-10 auth-in">
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Spotr
          </h1>
        </div>

        <div className="relative z-10 auth-in" style={{ animationDelay: '0.12s' }}>
          <h2 className="text-5xl font-bold leading-[1.1] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Descubre lugares<br />que nadie te contó.
          </h2>
          <p className="text-white/60 text-lg mt-5 max-w-md leading-relaxed">
            Comparte tus spots secretos, guarda los que quieres visitar y explora tu ciudad como un local.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/50 text-sm auth-in" style={{ animationDelay: '0.24s' }}>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bookmark</span>
            Wishlist de spots
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>map</span>
            Mapa interactivo
          </span>
        </div>
      </div>

      {/* ── FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] auth-in">

          {/* Logo (mobile only) */}
          <h1 className="lg:hidden text-3xl font-bold text-center mb-8 tracking-tighter text-[#1b1b1b]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Spotr
          </h1>

          {/* Segmented control */}
          <div className="relative flex bg-gray-100 rounded-full p-1 mb-8">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}
            />
            <button
              onClick={() => switchMode(true)}
              className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-full transition-colors ${isLogin ? 'text-gray-900' : 'text-gray-400'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-full transition-colors ${!isLogin ? 'text-gray-900' : 'text-gray-400'}`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Heading (swaps with animation) */}
          <div key={isLogin ? 'l' : 'r'} className="animate-fade-swap mb-6">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLogin ? 'Inicia sesión para seguir explorando.' : 'Únete y empieza a coleccionar spots.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" style={{ fontSize: 20 }}>
                person
              </span>
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" style={{ fontSize: 20 }}>
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-900/5 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="animate-slide-down flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className={`relative h-[52px] rounded-xl font-semibold text-sm text-white overflow-hidden transition-all active:scale-[0.98] disabled:active:scale-100 mt-2 ${
                success ? 'bg-emerald-500' : 'bg-black hover:bg-gray-800'
              } ${error ? 'animate-shake' : ''}`}
            >
              <span className={`flex items-center justify-center gap-2 transition-opacity ${loading || success ? 'opacity-0' : 'opacity-100'}`}>
                {isLogin ? 'Entrar' : 'Registrarse'}
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </span>

              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              )}

              {success && (
                <span className="absolute inset-0 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-pop-check" style={{ fontSize: 22 }}>check_circle</span>
                  ¡Cuenta creada!
                </span>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              onClick={() => switchMode(!isLogin)}
              className="text-gray-900 font-bold hover:underline underline-offset-2 transition-all"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
