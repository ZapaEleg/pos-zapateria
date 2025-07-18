import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
    const [fade, setFade] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Inicia la transición de desvanecido después de un momento
        const fadeTimer = setTimeout(() => setFade(true), 1500);
        // Navega a la pantalla de ventas después de que termine la animación
        const redirectTimer = setTimeout(() => navigate('/venta'), 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    return (
        <div className={`welcome-container ${fade ? 'fade-out' : ''}`}>
            <h1>Bienvenido a ZapaEleg POS</h1>
        </div>
    );
};

export default Welcome;