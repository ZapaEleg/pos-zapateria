import React from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart2 } from 'react-icons/fi';

const DeepAnalysis = () => {
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <FiBarChart2 size={48} style={{ color: '#6D28D9', marginBottom: '20px' }} />
            <h1>Análisis Profundo</h1>
            <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                Esta sección está en desarrollo y contendrá las métricas avanzadas de tu negocio.
            </p>
            <Link to="/admin/dashboard" style={{
                padding: '10px 20px',
                backgroundColor: '#6D28D9',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600'
            }}>
                Regresar al Dashboard
            </Link>
        </div>
    );
};

export default DeepAnalysis;
