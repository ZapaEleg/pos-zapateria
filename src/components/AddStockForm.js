import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './AddStockForm.css';

// Mapeo de categorías y rangos de tallas
const CATEGORIES = [
  { label: 'Caballero', value: 'caballero', sizes: Array.from({ length: 10 }, (_, i) => (25 + i * 0.5).toFixed(1)) }, // 25-29.5
  { label: 'Dama', value: 'dama', sizes: Array.from({ length: 10 }, (_, i) => (22 + i * 0.5).toFixed(1)) }, // 22-26.5
  { label: 'Niña', value: 'niña', sizes: Array.from({ length: 28 }, (_, i) => (12 + i * 0.5).toFixed(1)) }, // 12-25.5
  { label: 'Niño', value: 'niño', sizes: Array.from({ length: 28 }, (_, i) => (12 + i * 0.5).toFixed(1)) }, // 12-25.5
];

const AddStockForm = () => {
  // Estado general
  const [brands, setBrands] = useState([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [sizes, setSizes] = useState([]); // tallas a mostrar
  const [sizeStocks, setSizeStocks] = useState({}); // { talla: cantidad }
  const [skuPrefix, setSkuPrefix] = useState('');
  const [precioMayoreo, setPrecioMayoreo] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [creating, setCreating] = useState(false);

  // --- Cargar marcas ---
  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('id, name');
      if (data) setBrands(data);
    };
    fetchBrands();
  }, []);

  // --- Al seleccionar categoría, generar tallas ---
  useEffect(() => {
    const catObj = CATEGORIES.find(cat => cat.value === category);
    if (catObj) {
      setSizes(catObj.sizes);
      // Reset distribución
      setSizeStocks(catObj.sizes.reduce((acc, s) => ({ ...acc, [s]: '' }), {}));
    } else {
      setSizes([]);
      setSizeStocks({});
    }
  }, [category]);

  // --- Precio de venta automático ---
  useEffect(() => {
    if (!isNaN(parseFloat(precioMayoreo)) && precioMayoreo !== '') {
      const pv = parseFloat(precioMayoreo) * 1.7 + 20;
      setPrecioVenta(pv.toFixed(2));
    } else {
      setPrecioVenta('');
    }
  }, [precioMayoreo]);

  // --- Calcular stock total
  const totalStock = Object.values(sizeStocks).reduce((acc, qty) => acc + (parseInt(qty) || 0), 0);

  // --- Guardar producto y variantes ---
  const handleSave = async () => {
    if (!brand || !model || !color || !category || !precioMayoreo || !precioVenta) {
      alert('Completa todos los campos requeridos');
      return;
    }
    if (totalStock === 0) {
      alert('Debes distribuir al menos un par en alguna talla.');
      return;
    }
    setCreating(true);

    // 1. Buscar o crear marca
    let brandId;
    let brandObj = brands.find(b => b.name.toLowerCase() === brand.toLowerCase());
    if (!brandObj) {
      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({ name: brand })
        .select('id, name')
        .single();
      if (brandError) {
        alert('Error al crear la marca');
        setCreating(false);
        return;
      }
      brandId = newBrand.id;
      setBrands([...brands, newBrand]);
    } else {
      brandId = brandObj.id;
    }

    // 2. Buscar o crear producto
    let productId;
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('brand_id', brandId)
      .eq('model', model)
      .maybeSingle();
    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const { data: newProd, error } = await supabase
        .from('products')
        .insert({ brand_id: brandId, model, category })
        .select('id')
        .single();
      if (error) {
        alert('Error al crear el producto');
        setCreating(false);
        return;
      }
      productId = newProd.id;
    }

    // 3. Crear variantes por cada talla con stock > 0
    const variantsToInsert = [];
    sizes.forEach(size => {
      const qty = parseInt(sizeStocks[size]) || 0;
      if (qty > 0) {
        // SKU: puedes poner una lógica más avanzada según tu preferencia
        const sku = `${skuPrefix || (brand.slice(0,3).toUpperCase())}-${model.replace(/\s/g,"").slice(0,3).toUpperCase()}-${color.replace(/\s/g,"").slice(0,3).toUpperCase()}-${size}`;
        variantsToInsert.push({
          product_id: productId,
          color,
          size,
          price: precioVenta,
          sku,
          stock: qty,
        });
      }
    });

    if (variantsToInsert.length === 0) {
      alert('Debes distribuir al menos un par en alguna talla.');
      setCreating(false);
      return;
    }

    const { error: variantErr } = await supabase
      .from('variants')
      .insert(variantsToInsert);

    if (variantErr) {
      alert('Error al guardar: ' + variantErr.message);
      setCreating(false);
      return;
    }

    setCreating(false);
    alert('¡Producto guardado con éxito!');
    // Reset
    setModel('');
    setColor('');
    setCategory('');
    setSizes([]);
    setSizeStocks({});
    setSkuPrefix('');
    setPrecioMayoreo('');
    setPrecioVenta('');
  };

  // --- Render ---
  return (
    <div className="add-stock-form">
      <h2>Alta de Producto / Añadir Stock</h2>
      <div className="form-row">
        <label>Marca:</label>
        <input
          list="brand-list"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="Escribe o selecciona"
          autoComplete="off"
        />
        <datalist id="brand-list">
          {brands.map(b => (
            <option key={b.id} value={b.name} />
          ))}
        </datalist>
      </div>
      <div className="form-row">
        <label>Modelo:</label>
        <input value={model} onChange={e => setModel(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Color:</label>
        <input value={color} onChange={e => setColor(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Categoría:</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Selecciona</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Prefijo SKU (opcional):</label>
        <input value={skuPrefix} onChange={e => setSkuPrefix(e.target.value)} placeholder="Ej: NIKE-AIR-BLK" />
      </div>
      <div className="form-row">
        <label>Precio de mayoreo:</label>
        <input
          type="number"
          min={0}
          value={precioMayoreo}
          onChange={e => setPrecioMayoreo(e.target.value)}
          placeholder="Ejemplo: 500"
        />
      </div>
      <div className="form-row">
        <label>Precio de venta:</label>
        <input
          type="number"
          min={0}
          value={precioVenta}
          readOnly
          style={{ background: "#f3f3f3" }}
        />
      </div>
      {/* --- Distribución de tallas --- */}
      {sizes.length > 0 && (
        <div className="tallas-table-section">
          <label>Distribuir stock por talla:</label>
          <div className="tallas-table-scroll">
            <table className="tallas-table">
              <thead>
                <tr>
                  {sizes.map(s => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {sizes.map(s => (
                    <td key={s}>
                      <input
                        type="number"
                        min={0}
                        value={sizeStocks[s] || ''}
                        onChange={e =>
                          setSizeStocks(prev => ({ ...prev, [s]: e.target.value }))}
                        style={{ width: 46, textAlign: 'center' }}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12, fontWeight:600}}>Total pares: {totalStock}</div>
        </div>
      )}
      <div className="form-row" style={{marginTop: 24}}>
        <button className="primary-button" onClick={handleSave} disabled={creating}>
          {creating ? "Guardando..." : "Guardar producto"}
        </button>
      </div>
    </div>
  );
};

export default AddStockForm;