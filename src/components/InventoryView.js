import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FiFilter, FiEdit, FiTrash2, FiPackage, FiDollarSign } from 'react-icons/fi';
import Modal from './Modal';
import './InventoryView.css';

/**
 * Componente profesional para consulta y gestión de inventario.
 * - Visualiza productos con filtros avanzados.
 * - Permite edición y eliminación de productos.
 * - Manejo robusto de errores y estados.
 */
const InventoryView = () => {
  // --- ESTADOS ---
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ total_pairs: 0, total_value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    brand_id: '',
    color: '',
    category: '',
    size_min: '',
    size_max: '',
    price_min: '',
    price_max: '',
  });
  const [filterOptions, setFilterOptions] = useState({ brands: [], colors: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // --- CARGA DE OPCIONES DE FILTRO ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data: brands } = await supabase.from('brands').select('id, name').order('name');
        const { data: colors } = await supabase.from('variants').select('color').limit(100);
        const uniqueColors = colors ? [...new Set(colors.filter(c => c.color).map(c => c.color))] : [];
        setFilterOptions({ brands: brands || [], colors: uniqueColors });
      } catch (e) {
        // Si falla, deja filtros vacíos pero no detiene la app
        setFilterOptions({ brands: [], colors: [] });
      }
    };
    fetchFilterOptions();
  }, []);

  // --- CARGA DE INVENTARIO ---
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_inventory_by_filters', {
        p_brand_id: filters.brand_id || null,
        p_color: filters.color || null,
        p_category: filters.category || null,
        p_size_min: filters.size_min || null,
        p_size_max: filters.size_max || null,
        p_price_min: filters.price_min || null,
        p_price_max: filters.price_max || null,
      });

      if (error) {
        setInventory([]);
        setSummary({ total_pairs: 0, total_value: 0 });
        setError('Error al obtener el inventario: ' + error.message);
      } else {
        setInventory((data && Array.isArray(data.results)) ? data.results : []);
        setSummary(data && data.summary ? data.summary : { total_pairs: 0, total_value: 0 });
      }
    } catch (e) {
      setInventory([]);
      setSummary({ total_pairs: 0, total_value: 0 });
      setError('Error desconocido al obtener el inventario.');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // --- MANEJO DE FILTROS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // --- ELIMINAR VARIANTE ---
  const handleDelete = async (variantId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este item del inventario? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('variants').delete().eq('id', variantId);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        alert('Item eliminado con éxito.');
        fetchInventory();
      }
    }
  };

  // --- MODAL DE EDICIÓN (Placeholder, implementa según tu Modal) ---
  const openEditModal = (variant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  };

  // --- RECOMENDACIÓN: Añade paginación si tu inventario es muy grande ---
  // --- RECOMENDACIÓN: Permite exportar el inventario a Excel/CSV si lo requieren ---

  // --- RENDER ---
  return (
    <div className="inventory-view">
      <h3>
        <FiPackage style={{ marginRight: 8 }} />
        Inventario
      </h3>
      <div className="filter-panel">
        <select name="brand_id" value={filters.brand_id} onChange={handleFilterChange}>
          <option value="">Todas las marcas</option>
          {filterOptions.brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select name="color" value={filters.color} onChange={handleFilterChange}>
          <option value="">Todos los colores</option>
          {filterOptions.colors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="text" name="category" value={filters.category} onChange={handleFilterChange} placeholder="Categoría" />
        <input type="number" name="size_min" value={filters.size_min} onChange={handleFilterChange} placeholder="Talla mín." min="0" />
        <input type="number" name="size_max" value={filters.size_max} onChange={handleFilterChange} placeholder="Talla máx." min="0" />
        <input type="number" name="price_min" value={filters.price_min} onChange={handleFilterChange} placeholder="Precio mín." min="0" />
        <input type="number" name="price_max" value={filters.price_max} onChange={handleFilterChange} placeholder="Precio máx." min="0" />
        <button className="action-btn" title="Filtrar" onClick={fetchInventory}><FiFilter /></button>
      </div>
      <div className="summary-panel">
        <div className="summary-card">
          <FiPackage />
          <div>
            <span>Total pares</span>
            <strong>{summary.total_pairs}</strong>
          </div>
        </div>
        <div className="summary-card">
          <FiDollarSign />
          <div>
            <span>Valor total</span>
            <strong>${summary.total_value}</strong>
          </div>
        </div>
      </div>
      <div className="inventory-table-container">
        {loading ? (
          <div>Cargando inventario...</div>
        ) : error ? (
          <div style={{ color: 'red', margin: '1em 0' }}>{error}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Color</th>
                <th>Talla</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No hay productos para mostrar.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {/* Mostrar marca de forma robusta */}
                      {item.brand_name ||
                        item.brand ||
                        (item.brand && item.brand.name) ||
                        "-"}
                    </td>
                    <td>{item.model || item.modelo || "-"}</td>
                    <td>{item.color || "-"}</td>
                    <td>{item.size || item.talla || item.numeracion || "-"}</td>
                    <td>{item.category || item.categoria || "-"}</td>
                    <td>${item.price !== undefined ? item.price : '-'}</td>
                    <td>{item.stock !== undefined ? item.stock : '-'}</td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                    <td className="actions-cell">
                      <button className="action-btn edit" onClick={() => openEditModal(item)} title="Editar"><FiEdit /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Eliminar"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {/* Implementa tu formulario de edición aquí */}
          <div>
            <h4>Edición de producto (por implementar)</h4>
            <pre>{JSON.stringify(editingVariant, null, 2)}</pre>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryView;