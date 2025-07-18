import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Welcome from './components/Welcome';
import RegisterSale from './components/RegisterSale';
import Auth from './components/Auth';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import InventoryView from './components/InventoryView';
import AddStockForm from './components/AddStockForm';
import PublicInventoryView from './components/PublicInventoryView';
import './App.css';

const ProtectedRoute = ({ session, children }) => {
    if (!session) {
        return <Navigate to="/admin" replace />;
    }
    return <AdminLayout>{children}</AdminLayout>;
};

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const triggerRefresh = () => {
        console.log("Refrescando datos..."); // Para depuración
        setRefreshKey(prevKey => prevKey + 1);
    };

    if (loading) {
        return <div className="global-loader">Cargando...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/venta" element={<RegisterSale onSaleComplete={triggerRefresh} />} />
                <Route path="/inventario" element={<PublicInventoryView />} />
                <Route path="/admin" element={session ? <Navigate to="/admin/dashboard" /> : <Auth />} />
                
                <Route path="/admin/dashboard" element={<ProtectedRoute session={session}><Dashboard refreshKey={refreshKey} /></ProtectedRoute>} />
                <Route path="/admin/inventario" element={<ProtectedRoute session={session}><InventoryView refreshKey={refreshKey} /></ProtectedRoute>} />
                <Route path="/admin/stock" element={<ProtectedRoute session={session}><AddStockForm onStockAdded={triggerRefresh} /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
