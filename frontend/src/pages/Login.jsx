import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      // Petición al API Gateway (Puerto 5500)
      const { data } = await axios.post(`http://localhost:5500${endpoint}`, {
        username,
        password
      });

      if (isLogin) {
        // Guardamos el token en el navegador
        localStorage.setItem('token', data.token);
        // Redirigimos al mapa principal
        navigate('/');
      } else {
        alert('Usuario creado con éxito. Ahora inicia sesión.');
        setIsLogin(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Ocurrió un error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#1b1b1b]" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Spotr
        </h1>
        <h2 className="text-xl font-semibold mb-4 text-center">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Usuario" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            required
          />
          <button 
            type="submit" 
            className="bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span 
            className="text-black font-bold cursor-pointer underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;