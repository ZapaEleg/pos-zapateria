import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './Dashboard.css';
import { FiDollarSign, FiCalendar, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const dateFilters = [
  { label: "Hoy", value: "day" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Este año", value: "year" },
  { label: "Todo", value: "all" }
];

function getDateRange(filter) {
  const now = new Date();
  let from, to;
  to = new Date();
  switch (filter) {
    case "day":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const first = now.getDate() - now.getDay();
      from = new Date(now.setDate(first));
      from.setHours(0, 0, 0, 0);
      to = new Date();
      to.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case "all":
    default:
      from = null;
      to = null;
  }
  return { from, to };
}

const Dashboard = ({ refreshKey }) => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ total_sales: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState("day");
  const [expandedRows, setExpandedRows] = useState({});

  // Traer ventas + sus items (productos vendidos) + producto/modelo
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange(dateFilter);

      // JOIN anidado: sale_items -> variants -> products
      let query = supabase
        .from('sales')
        .select(`
          id, sale_timestamp, total_amount, notes,
          sale_items(
            id, quantity, price_at_sale,
            variants(
              color, size, price,
              products(model)
            )
          )
        `)
        .order('sale_timestamp', { ascending: false });

      if (from && to) {
        query = query.gte('sale_timestamp', from.toISOString()).lte('sale_timestamp', to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        setSales([]);
        setSummary({ total_sales: 0, total_amount: 0 });
        setError('Error al obtener las ventas: ' + error.message);
      } else {
        setSales(Array.isArray(data) ? data : []);
        // Calcula resumen
        const total_sales = data.length;
        const total_amount = data.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
        setSummary({ total_sales, total_amount });
      }
    } catch (e) {
      setSales([]);
      setSummary({ total_sales: 0, total_amount: 0 });
      setError('Error desconocido al obtener las ventas.');
    }
    setLoading(false);
  }, [dateFilter, refreshKey]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Expande/cierra la fila de detalles de una venta
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="dashboard-view">
      <h3>
        <FiDollarSign style={{ marginRight: 8 }} />
        Ventas
      </h3>
      <div className="filter-panel">
        {dateFilters.map(f => (
          <button
            key={f.value}
            className={`filter-btn${dateFilter === f.value ? ' active' : ''}`}
            onClick={() => setDateFilter(f.value)}
          >
            <FiCalendar style={{ marginRight: 4 }} />
            {f.label}
          </button>
        ))}
        <button className="action-btn" title="Actualizar" onClick={fetchSales}>
          <FiFilter />
        </button>
      </div>
      <div className="summary-panel">
        <div className="summary-card">
          <FiDollarSign />
          <div>
            <span>Total de ventas</span>
            <strong>{summary.total_sales}</strong>
          </div>
        </div>
        <div className="summary-card">
          <FiDollarSign />
          <div>
            <span>Importe total</span>
            <strong>${summary.total_amount.toLocaleString()}</strong>
          </div>
        </div>
      </div>
      <div className="dashboard-table-container">
        {loading ? (
          <div>Cargando ventas...</div>
        ) : error ? (
          <div style={{ color: 'red', margin: '1em 0' }}>{error}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No hay ventas para mostrar.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr>
                      <td>
                        <button onClick={() => toggleRow(sale.id)} className="action-btn" title={expandedRows[sale.id] ? "Ocultar detalles" : "Ver detalles"}>
                          {expandedRows[sale.id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </td>
                      <td>{sale.id}</td>
                      <td>{sale.sale_timestamp ? new Date(sale.sale_timestamp).toLocaleString() : '-'}</td>
                      <td>${Number(sale.total_amount).toLocaleString()}</td>
                      <td>{sale.notes || '-'}</td>
                    </tr>
                    {expandedRows[sale.id] && (
                      <tr>
                        <td colSpan={5}>
                          <strong>Productos vendidos:</strong>
                          {sale.sale_items && sale.sale_items.length > 0 ? (
                            <table className="sale-items-table">
                              <thead>
                                <tr>
                                  <th>Modelo</th>
                                  <th>Color</th>
                                  <th>Talla</th>
                                  <th>Cantidad</th>
                                  <th>Precio unitario</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.sale_items.map(item => (
                                  <tr key={item.id}>
                                    <td>{item.variants?.products?.model || '-'}</td>
                                    <td>{item.variants?.color || '-'}</td>
                                    <td>{item.variants?.size || '-'}</td>
                                    <td>{item.quantity}</td>
                                    <td>${Number(item.price_at_sale).toLocaleString()}</td>
                                    <td>${Number(item.price_at_sale * item.quantity).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div>No hay productos registrados en esta venta.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;