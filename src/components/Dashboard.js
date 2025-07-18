import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiBarChart2, FiList, FiTrendingUp } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = ({ refreshKey }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today');

    const getDateRange = (period) => {
        const end = new Date();
        const start = new Date();
        switch (period) {
            case 'week':
                start.setDate(start.getDate() - start.getDay());
                break;
            case 'month':
                start.setDate(1);
                break;
            case 'year':
                start.setFullYear(start.getFullYear(), 0, 1);
                break;
            case 'today':
            default:
                break;
        }
        start.setHours(0, 0, 0, 0);
        return { start: start.toISOString(), end: end.toISOString() };
    };

    useEffect(() => {
        const fetchSales = async () => {
            setLoading(true);
            const { start, end } = getDateRange(filter);

            console.log(`Dashboard refrescando datos para el período: ${filter}`);

            const { data, error } = await supabase
                .from('sales')
                .select(`*, sale_items(*, variants(*, products(*, brands(*))))`)
                .gte('sale_timestamp', start)
                .lte('sale_timestamp', end)
                .order('sale_timestamp', { ascending: false });
            
            if (error) {
                console.error('Error fetching sales:', error);
                setSales([]);
            } else {
                setSales(data || []);
            }
            setLoading(false);
        };

        fetchSales();
    }, [refreshKey, filter]);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h3><FiBarChart2 /> Resumen de Ventas</h3>
                <div className="filter-controls">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="year">Este Año</option>
                    </select>
                    <Link to="/admin/analisis" className="deep-analysis-button">
                        <FiTrendingUp /> Análisis Profundo
                    </Link>
                </div>
            </div>

            <div className="sales-history-table">
                <h4><FiList /> Ventas Registradas en el Periodo</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Folio</th>
                            <th>Fecha y Hora</th>
                            <th>Items Vendidos</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="loading-cell">Cargando...</td></tr>
                        ) : sales.length > 0 ? (
                            sales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{new Date(sale.sale_timestamp).toLocaleString('es-MX')}</td>
                                    <td>
                                        <ul className="item-list">
                                            {sale.sale_items.map(item => (
                                                <li key={item.id}>
                                                    {item.quantity}x {item.variants.products.brands.name} {item.variants.products.model} ({item.variants.color}, #{item.variants.size})
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="total-cell">${sale.total_amount.toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="no-data-cell">No hay ventas registradas en este periodo.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
