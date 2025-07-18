import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiGrid, FiBox, FiPlusSquare, FiLogOut, FiShoppingCart } from 'react-icons/fi';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/venta');
    };

    return (
        <div className="admin-layout">
            <nav className="admin-nav">
                <div className="nav-header">
                    ZapaEleg POS
                </div>
                <div className="nav-links">
                    <NavLink to="/admin/dashboard"><FiGrid /> Dashboard</NavLink>
                    <NavLink to="/admin/inventario"><FiBox /> Inventario</NavLink>
                    <NavLink to="/admin/stock"><FiPlusSquare /> Añadir Stock</NavLink>
                </div>
                <div className="nav-footer">
                    <NavLink to="/venta" className="footer-link"><FiShoppingCart /> Ir a Ventas</NavLink>
                    <button onClick={handleLogout}><FiLogOut /> Cerrar Sesión</button>
                </div>
            </nav>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;