import React from 'react';
import { Link } from 'react-router-dom';

const PublicInventoryView = () => {
    // Este es un componente temporal mientras se desarrolla la funcionalidad completa.
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            backgroundColor: '#f9fafb'
        }}>
            <h1 style={{ color: '#111827' }}>Consulta de Inventario</h1>
            <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                Esta sección está actualmente en desarrollo.
            </p>
            <Link to="/venta" style={{
                padding: '10px 20px',
                backgroundColor: '#6D28D9',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600'
            }}>
                Regresar a Ventas
            </Link>
        </div>
    );
};

export default PublicInventoryView;
