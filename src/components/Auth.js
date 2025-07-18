import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importamos useNavigate
import './Auth.css'; // Asegúrate de tener este archivo de estilos

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Inicializamos el hook de navegación

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage('');
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) throw error;

            // ¡Éxito! Redirigimos al dashboard.
            navigate('/admin/dashboard');

        } catch (error) {
            setMessage(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Acceso de Administrador</h2>
                <p>Inicia sesión para acceder al dashboard y la gestión de inventario.</p>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Tu correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading} className="primary-button">
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                {message && <p className="error-message">{message}</p>}
            </div>
        </div>
    );
};

export default Auth;