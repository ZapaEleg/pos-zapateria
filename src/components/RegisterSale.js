import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TicketModal from './TicketModal';
import './RegisterSale.css';

const defaultProduct = {
  brand: '',
  model: '',
  color: '',
  size: '',
  price: '',
  sku: '',
  variant_id: null,
  discount: 0,
  final_price: '',
  quantity: 1,
};

const RegisterSale = ({ onSaleComplete }) => {
  // Estados generales
  const [brands, setBrands] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [filteredSizes, setFilteredSizes] = useState([]);
  const [product, setProduct] = useState({ ...defaultProduct });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cliente y venta
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [saleDate, setSaleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [isApartado, setIsApartado] = useState(false);
  const [anticipo, setAnticipo] = useState('');
  const [restante, setRestante] = useState('');
  const [expiraEl, setExpiraEl] = useState(null);

  // Pago
  const [paymentType, setPaymentType] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);

  // Refs para inputs
  const brandRef = useRef();
  const modelRef = useRef();
  const colorRef = useRef();
  const sizeRef = useRef();
  const quantityRef = useRef();

  // Navegador de rutas
  const navigate = useNavigate();

  // --- Utilidad para fecha de expiración de apartado
  function calcularFechaExpiracionApartado(inicio) {
    let dias = 0;
    let fecha = new Date(inicio);
    while (dias < 20) {
      fecha.setDate(fecha.getDate() + 1);
      if (fecha.getDay() !== 6) {
        dias++;
      }
    }
    return fecha;
  }

  // --- Cargar marcas ---
  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('id, name');
      if (data) setBrands(data);
    };
    fetchBrands();
  }, []);

  // --- Autocompletar y filtrar modelos según marca ---
  useEffect(() => {
    const fetchModels = async () => {
      setFilteredModels([]);
      setProduct(p => ({ ...p, model: '', color: '', size: '', sku: '', price: '', variant_id: null }));
      if (!product.brand) return;
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase());
      if (!brandObj) return;
      const { data: products } = await supabase
        .from('products')
        .select('model')
        .eq('brand_id', brandObj.id);
      if (products) {
        const models = [...new Set(products.map(p => p.model))];
        setFilteredModels(models);
      }
    };
    fetchModels();
    // eslint-disable-next-line
  }, [product.brand, brands]);

  // --- Autocompletar colores según marca y modelo ---
  useEffect(() => {
    const fetchColors = async () => {
      setFilteredColors([]);
      setProduct(p => ({ ...p, color: '', size: '', sku: '', price: '', variant_id: null }));
      if (!product.brand || !product.model) return;
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase());
      if (!brandObj) return;
      const { data: prod } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', brandObj.id)
        .eq('model', product.model)
        .maybeSingle();
      if (!prod) return;
      const { data: variants } = await supabase
        .from('variants')
        .select('color')
        .eq('product_id', prod.id);
      if (variants) {
        const colors = [...new Set(variants.map(v => v.color))];
        setFilteredColors(colors);
      }
    };
    fetchColors();
    // eslint-disable-next-line
  }, [product.brand, product.model, brands]);

  // --- Autocompletar tallas según marca, modelo, color ---
  useEffect(() => {
    const fetchSizes = async () => {
      setFilteredSizes([]);
      setProduct(p => ({ ...p, size: '', sku: '', price: '', variant_id: null }));
      if (!product.brand || !product.model || !product.color) return;
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase());
      if (!brandObj) return;
      const { data: prod } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', brandObj.id)
        .eq('model', product.model)
        .maybeSingle();
      if (!prod) return;
      const { data: variants } = await supabase
        .from('variants')
        .select('size')
        .eq('product_id', prod.id)
        .eq('color', product.color);
      if (variants) {
        const sizes = [...new Set(variants.map(v => v.size))];
        setFilteredSizes(sizes);
      }
    };
    fetchSizes();
    // eslint-disable-next-line
  }, [product.brand, product.model, product.color, brands]);

  // --- Al seleccionar talla, traer SKU y precio ---
  useEffect(() => {
    const fetchVariantInfo = async () => {
      setProduct(p => ({ ...p, sku: '', price: '', variant_id: null, final_price: '', discount: 0 }));
      if (!product.brand || !product.model || !product.color || !product.size) return;
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase());
      if (!brandObj) return;
      const { data: prod } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', brandObj.id)
        .eq('model', product.model)
        .maybeSingle();
      if (!prod) return;
      const { data: variant } = await supabase
        .from('variants')
        .select('id, sku, price')
        .eq('product_id', prod.id)
        .eq('color', product.color)
        .eq('size', product.size)
        .maybeSingle();
      if (variant) {
        setProduct(prev => ({
          ...prev,
          sku: variant.sku,
          price: variant.price,
          variant_id: variant.id,
          final_price: variant.price,
          discount: 0,
        }));
      }
    };
    fetchVariantInfo();
    // eslint-disable-next-line
  }, [product.brand, product.model, product.color, product.size, brands]);

  // --- Apartado: cálculo restante y expiración ---
  useEffect(() => {
    if (isApartado && anticipo && !isNaN(anticipo)) {
      const cartTotal = cart.reduce(
        (acc, item) => acc + (Number(item.final_price) || 0) * (Number(item.quantity) || 0),
        0
      );
      const restanteCalc = Math.max(0, cartTotal - Number(anticipo));
      setRestante(restanteCalc);
    } else {
      setRestante('');
    }
    if (isApartado) {
      setExpiraEl(calcularFechaExpiracionApartado(saleDate));
    } else {
      setExpiraEl(null);
    }
  }, [isApartado, anticipo, cart, saleDate]);

  // --- Descuento ---
  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    setProduct(prev => ({
      ...prev,
      discount: discount,
      final_price: Math.max(0, (parseFloat(prev.price) || 0) - discount).toFixed(2),
    }));
  };

  // --- Agregar producto al carrito ---
  const handleAddProduct = () => {
    if (
      !product.variant_id ||
      !product.brand ||
      !product.model ||
      !product.color ||
      !product.size ||
      !product.price
    ) {
      alert('Selecciona un producto válido del inventario.');
      return;
    }
    setCart([...cart, { ...product }]);
    setProduct({ ...defaultProduct });
  };

  // --- Eliminar producto del carrito ---
  const handleRemoveProduct = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // --- Total ---
  const cartTotal = cart.reduce(
    (acc, item) => acc + (Number(item.final_price) || 0) * (Number(item.quantity) || 0),
    0
  );

  // --- Guardar cliente si no existe ---
  const saveCustomer = async (name, phone) => {
    if (!phone) return null;
    const normalized = phone.replace(/\D/g, '');
    const { data: existing, error: searchError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle();
    if (searchError) return null;
    if (existing) return existing.id;
    const { data: inserted, error: insertError } = await supabase
      .from('customers')
      .insert([{ name: name || '', phone: normalized }])
      .select('id')
      .single();
    if (insertError) return null;
    return inserted.id;
  };

  // --- Registro de venta ---
  const executeSale = async () => {
    setLoading(true);
    try {
      const cart_items = cart
        .filter(item => item.quantity > 0)
        .map(item => ({
          variant_id: item.variant_id,
          quantity: parseInt(item.quantity, 10),
          price_at_sale: parseFloat(item.final_price),
          discount: parseFloat(item.discount) || 0,
        }));

      if (cart_items.length === 0) {
        alert('Agrega al menos un producto para registrar la venta.');
        setLoading(false);
        return;
      }

      const totalAmount = cart_items.reduce((sum, i) => sum + i.quantity * i.price_at_sale, 0);
      const finalSaleTimestamp = new Date(saleDate);
      finalSaleTimestamp.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

      // 1. Registrar cliente
      let customerId = null;
      if (customerPhone) {
        customerId = await saveCustomer(customerName, customerPhone);
      }

      // 2. Registrar venta
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            sale_timestamp: finalSaleTimestamp.toISOString(),
            total_amount: totalAmount,
            notes: customerNotes,
            customer_id: customerId,
            is_apartado: isApartado,
            anticipo: isApartado ? Number(anticipo) : null,
            restante: isApartado ? Number(restante) : null,
            apartado_expira: isApartado && expiraEl ? expiraEl.toISOString() : null,
          }
        ])
        .select('id')
        .single();

      if (saleError) {
        alert('Error al registrar la venta: ' + saleError.message);
        setLoading(false);
        return;
      }

      const saleId = saleData.id;

      // 3. Guardar productos vendidos
      const saleItemsToInsert = cart_items.map(item => ({
        sale_id: saleId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale,
        discount: item.discount,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsToInsert);

      if (itemsError) {
        alert('Venta registrada, pero error al guardar productos: ' + itemsError.message);
        setLoading(false);
        return;
      }

      setLastSaleData({
        id: saleId,
        cart: cart,
        total: totalAmount,
        timestamp: finalSaleTimestamp.toISOString(),
        customerPhone,
        customerName,
        isApartado,
        anticipo,
        restante,
        expiraEl: isApartado && expiraEl ? expiraEl.toLocaleDateString('es-MX') : null,
      });
      setIsTicketModalOpen(true);
      setPipOpen(false);
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setCustomerNotes('');
      setAnticipo('');
      setRestante('');
      setProduct({ ...defaultProduct });
      setIsApartado(false);
      if (onSaleComplete) onSaleComplete();
    } catch (e) {
      alert('Error inesperado al registrar la venta.');
    }
    setLoading(false);
  };

  // --- PIP Pago ---
  const openPip = () => setPipOpen(true);
  const closePip = () => setPipOpen(false);

  const computeChange = () => {
    const efectivo = parseFloat(cashAmount) || 0;
    const transferencia = parseFloat(transferAmount) || 0;
    const totalPagado = efectivo + transferencia;
    if (totalPagado > cartTotal) return `Cambio: $${(totalPagado - cartTotal).toFixed(2)}`;
    if (totalPagado < cartTotal) return `Falta: $${(cartTotal - totalPagado).toFixed(2)}`;
    return "Pagado completo";
  };

  return (
    <div className="register-sale-main">
      {/* Botones fijos arriba a la derecha */}
      <div className="top-action-buttons">
        <button
          className="admin-btn"
          onClick={() => navigate('/admin')}
        >
          Administrador
        </button>
        <button
          className="inventory-btn"
          onClick={() => navigate('/inventario')}
        >
          Buscar en Inventario
        </button>
      </div>
      <header className="register-sale-header">
        <span className="header-title">Nota de Venta</span>
      </header>
      <div className="register-sale-form">
        <div className="form-row">
          <label>Fecha de la Venta:</label>
          <input
            type="date"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
            style={{ maxWidth: 170 }}
          />
        </div>
        <div className="form-row">
          <label>Nombre del cliente (opcional):</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Nombre del cliente"
            style={{ maxWidth: 220 }}
          />
        </div>
        <div className="form-row">
          <label>Tel. WhatsApp:</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            placeholder="10 dígitos"
            style={{ maxWidth: 170 }}
          />
        </div>
        <div className="form-row">
          <label>Notas (opcional):</label>
          <input
            type="text"
            value={customerNotes}
            onChange={e => setCustomerNotes(e.target.value)}
            placeholder="Notas"
            style={{ maxWidth: 280 }}
          />
        </div>
        {/* --- Apartado --- */}
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={isApartado}
              onChange={e => setIsApartado(e.target.checked)}
              style={{ marginRight: 7 }}
            />
            ¿Es apartado?
          </label>
          {isApartado && (
            <>
              <span style={{marginLeft:8}}>Anticipo: </span>
              <input
                type="number"
                min={0}
                value={anticipo}
                onChange={e => setAnticipo(e.target.value)}
                style={{ width: 100, marginRight: 10 }}
                placeholder="Monto"
              />
              <span>Resta: <b>${restante}</b></span>
              {expiraEl && (
                <span style={{marginLeft:16, color:'#6d28d9'}}>
                  Expira: <b>{expiraEl.toLocaleDateString('es-MX')}</b>
                </span>
              )}
            </>
          )}
        </div>
        {/* --- FORMULARIO DE PRODUCTO --- */}
        <div className="product-entry-section">
          <h4>Agregar Producto</h4>
          <div className="product-entry-grid">
            <div>
              <label>Marca:</label>
              <input
                list="brand-list"
                value={product.brand}
                onChange={e => setProduct(p => ({ ...p, brand: e.target.value }))}
                placeholder="Escribe o selecciona"
                autoComplete="off"
                ref={brandRef}
              />
              <datalist id="brand-list">
                {brands.map(b => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label>Modelo:</label>
              <input
                list="model-list"
                value={product.model}
                onChange={e => setProduct(p => ({ ...p, model: e.target.value }))}
                placeholder="Modelo"
                autoComplete="off"
                disabled={!product.brand}
                ref={modelRef}
              />
              <datalist id="model-list">
                {filteredModels.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label>Color:</label>
              <input
                list="color-list"
                value={product.color}
                onChange={e => setProduct(p => ({ ...p, color: e.target.value }))}
                placeholder="Color"
                autoComplete="off"
                disabled={!product.model}
                ref={colorRef}
              />
              <datalist id="color-list">
                {filteredColors.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label>Talla:</label>
              <input
                list="size-list"
                value={product.size}
                onChange={e => setProduct(p => ({ ...p, size: e.target.value }))}
                placeholder="Talla"
                autoComplete="off"
                disabled={!product.color}
                ref={sizeRef}
              />
              <datalist id="size-list">
                {filteredSizes.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label>SKU:</label>
              <input
                value={product.sku}
                readOnly
                placeholder="Autocompletado"
                style={{ background: "#f3f3f3" }}
                disabled
              />
            </div>
            <div>
              <label>Precio:</label>
              <input
                value={product.price}
                readOnly
                placeholder="Autocompletado"
                style={{ background: "#f3f3f3" }}
                disabled
              />
            </div>
            <div>
              <label>Descuento:</label>
              <input
                type="number"
                min={0}
                value={product.discount}
                onChange={handleDiscountChange}
                placeholder="Descuento $"
                disabled={!product.price}
              />
            </div>
            <div>
              <label>Precio final:</label>
              <input
                value={product.final_price}
                readOnly
                style={{ background: "#f3f3f3" }}
                disabled
              />
            </div>
            <div>
              <label>Cantidad:</label>
              <input
                type="number"
                min={1}
                value={product.quantity}
                onChange={e => setProduct(p => ({ ...p, quantity: e.target.value }))}
                disabled={!product.variant_id}
                ref={quantityRef}
              />
            </div>
            <button type="button" className="add-product-btn" onClick={handleAddProduct}>
              Agregar producto
            </button>
          </div>
        </div>
        {/* Tabla del carrito */}
        <div className="cart-table-section">
          <h4>Productos en la venta</h4>
          <table className="cart-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Cant.</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Color</th>
                <th>Talla</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Precio Final</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center' }}>Sin productos añadidos</td>
                </tr>
              ) : (
                cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.brand}</td>
                    <td>{item.model}</td>
                    <td>{item.color}</td>
                    <td>{item.size}</td>
                    <td>${Number(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>${Number(item.discount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>${Number(item.final_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>${(item.quantity * item.final_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <button className="remove-btn" onClick={() => handleRemoveProduct(idx)}>Quitar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="cart-total-row">
          <span>Total: </span>
          <span className="cart-total-amount">${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="review-btn"
            disabled={cart.length === 0}
            onClick={openPip}
          >
            Revisar venta
          </button>
        </div>
      </div>
      {/* PIP de pago */}
      {pipOpen && (
        <div className="pip-modal-bg">
          <div className="pip-modal">
            <button className="close-pip" onClick={closePip}>✕</button>
            <h3>Pago de la venta</h3>
            <div style={{ marginBottom: 10 }}>
              <strong>Total:</strong> ${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="form-row">
              <label>Tipo de pago:</label>
              <select
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                style={{ maxWidth: 150 }}
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            {(paymentType === 'cash' || paymentType === 'both') && (
              <div className="form-row">
                <label>Monto efectivo:</label>
                <input
                  type="number"
                  min={0}
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                />
              </div>
            )}
            {(paymentType === 'transfer' || paymentType === 'both') && (
              <div className="form-row">
                <label>Monto transferencia:</label>
                <input
                  type="number"
                  min={0}
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
            )}
            <div style={{ margin: '12px 0', fontWeight: 'bold', color: '#6d28d9' }}>
              {computeChange()}
            </div>
            <button
              className="primary-button"
              style={{ width: '100%', marginTop: 12 }}
              onClick={executeSale}
              disabled={loading}
            >
              {loading ? 'Guardando venta...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      )}
      {/* Ticket modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        saleData={lastSaleData}
        customerPhone={customerPhone}
        customerName={customerName}
        paymentType={paymentType}
        cashAmount={cashAmount}
        transferAmount={transferAmount}
      />
    </div>
  );
};

export default RegisterSale;