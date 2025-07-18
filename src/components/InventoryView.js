import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FiFilter, FiEdit, FiTrash2, FiPackage, FiDollarSign } from 'react-icons/fi';
import Modal from './Modal';
import './InventoryView.css';

const InventoryView = () => {
    // --- ESTADOS ---
    const [inventory, setInventory] = useState([]);
    const [summary, setSummary] = useState({ total_pairs: 0, total_value: 0 });
    const [loading, setLoading] = useState(true);
    
    // Estado para todos los filtros
    const [filters, setFilters] = useState({
        brand_id: '', color: '', category: '',
        size_min: '', size_max: '',
        price_min: '', price_max: ''
    });

    // Estado para las opciones de los menús desplegables
    const [filterOptions, setFilterOptions] = useState({ brands: [], colors: [] });

    // Estado para el modal de edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);

    // --- CARGA DE DATOS ---
    const fetchFilterOptions = async () => {
        const { data: brands } = await supabase.from('brands').select('id, name').order('name');
        const { data: colors } = await supabase.from('variants').select('color').limit(100);
        const uniqueColors = [...new Set(colors.map(c => c.color))];
        setFilterOptions({ brands: brands || [], colors: uniqueColors });
    };

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_inventory_by_filters', {
            p_brand_id: filters.brand_id || null,
            p_color: filters.color || null,
            p_category: filters.category || null,
            p_size_min: filters.size_min || null,
            p_size_max: filters.size_max || null,
            p_price_min: filters.price_min || null,
            p_price_max: filters.price_max || null
        });

        if (error) {
            console.error('Error fetching inventory:', error);
            setInventory([]);
            setSummary({ total_pairs: 0, total_value: 0 });
        } else {
            setInventory(data.results || []);
            setSummary(data.summary || { total_pairs: 0, total_value: 0 });
        }
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        fetchFilterOptions();
        fetchInventory();
    }, [fetchInventory]);

    // --- MANEJO DE EVENTOS ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (variantId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este item del inventario? Esta acción no se puede deshacer.')) {
            const { error } = await supabase.from('variants').delete().eq('id', variantId);
            if (error) {
                alert('Error al eliminar: ' + error.message);
            } else {
                alert('Item eliminado con éxito.');
                fetchInventory(); // Refrescar la vista
            }
        }
    };

    const openEditModal = (variant) => {
        setEditingVariant(variant);
        setIsModalOpen(true);
    };

    const handleUpdateVariant = async () => {
        const { error } = await supabase
            .from('variants')
            .update({
                price: editingVariant.price,
                stock: editingVariant.stock
            })
            .eq('id', editingVariant.variant_id);
        
        if (error) {
            alert('Error al actualizar: ' + error.message);
        } else {
            alert('Item actualizado con éxito.');
            setIsModalOpen(false);
            setEditingVariant(null);
            fetchInventory();
        }
    };

    return (
        <>
            <div className="inventory-view">
                <h3><FiFilter /> Consulta de Inventario</h3>
                <div className="filter-panel">
                    <select name="brand_id" value={filters.brand_id} onChange={handleFilterChange}>
                        <option value="">Todas las Marcas</option>
                        {filterOptions.brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select name="color" value={filters.color} onChange={handleFilterChange}>
                        <option value="">Todos los Colores</option>
                        {filterOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="">Todas las Categorías</option>
                        <option value="niña">Niña</option>
                        <option value="niño">Niño</option>
                        <option value="dama">Dama</option>
                        <option value="caballero">Caballero</option>
                    </select>
                    <input type="number" name="size_min" value={filters.size_min} onChange={handleFilterChange} placeholder="Talla Mín." />
                    <input type="number" name="size_max" value={filters.size_max} onChange={handleFilterChange} placeholder="Talla Máx." />
                    <input type="number" name="price_min" value={filters.price_min} onChange={handleFilterChange} placeholder="Precio Mín." />
                    <input type="number" name="price_max" value={filters.price_max} onChange={handleFilterChange} placeholder="Precio Máx." />
                </div>

                <div className="summary-panel">
                    <div className="summary-card">
                        <FiPackage />
                        <div>
                            <span>Total de Pares</span>
                            <strong>{summary.total_pairs || 0}</strong>
                        </div>
                    </div>
                    <div className="summary-card">
                        <FiDollarSign />
                        <div>
                            <span>Valor del Inventario</span>
                            <strong>${(summary.total_value || 0).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                <div className="inventory-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th><th>Marca</th><th>Modelo</th><th>Color</th><th>Talla</th>
                                <th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9">Cargando...</td></tr>
                            ) : inventory.length > 0 ? (
                                inventory.map(v => (
                                    <tr key={v.variant_id}>
                                        <td>{v.sku}</td><td>{v.brand}</td><td>{v.model}</td><td>{v.color}</td><td>{v.size}</td>
                                        <td>{v.category}</td><td>${v.price.toFixed(2)}</td><td>{v.stock}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => openEditModal(v)} className="action-btn edit"><FiEdit /></button>
                                            <button onClick={() => handleDelete(v.variant_id)} className="action-btn delete"><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9">No se encontraron resultados con los filtros aplicados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingVariant && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Editar: ${editingVariant.brand} ${editingVariant.model}`}>
                    <div className="edit-modal-content">
                        <div className="input-group">
                            <label>Precio de Venta</label>
                            <input type="number" value={editingVariant.price} onChange={(e) => setEditingVariant({...editingVariant, price: parseFloat(e.target.value)})} />
                        </div>
                        <div className="input-group">
                            <label>Cantidad en Stock</label>
                            <input type="number" value={editingVariant.stock} onChange={(e) => setEditingVariant({...editingVariant, stock: parseInt(e.target.value)})} />
                        </div>
                        <button onClick={handleUpdateVariant} className="primary-button">Guardar Cambios</button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default InventoryView;
