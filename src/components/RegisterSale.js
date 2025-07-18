import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import TicketModal from './TicketModal';
import { FiTrash2, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import './RegisterSale.css';

const RegisterSale = ({ onSaleComplete }) => {
    const [cart, setCart] = useState([]);
    const [currentItem, setCurrentItem] = useState({ brand: '', model: '', size: '', color: '', price: '', quantity: 1, sku: '' });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [lastSaleData, setLastSaleData] = useState(null);
    const [modalStep, setModalStep] = useState('payment');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [amountPaid, setAmountPaid] = useState({ efectivo: 0, transferencia: 0 });
    const [loading, setLoading] = useState(false);
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [brandSuggestions, setBrandSuggestions] = useState([]);
    const [modelSuggestions, setModelSuggestions] = useState([]);
    const brandInputRef = useRef(null);
    const modelInputRef = useRef(null);
    const sizeInputRef = useRef(null);
    const colorInputRef = useRef(null);
    const priceInputRef = useRef(null);
    const quantityInputRef = useRef(null);
    const skuInputRef = useRef(null);
    const addButtonRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data: brandsData } = await supabase.from('brands').select('id, name').order('name');
            const { data: productsData } = await supabase.from('products').select('id, model, brand_id');
            setBrands(brandsData || []);
            setModels(productsData || []);
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
        if (name === 'brand') {
            if (value) {
                const suggestions = brands.filter(b => b.name.toLowerCase().includes(value.toLowerCase()));
                setBrandSuggestions(suggestions);
            } else {
                setBrandSuggestions([]);
                setCurrentItem(prev => ({ ...prev, brandId: null, model: '', modelId: null }));
                setModelSuggestions([]);
            }
        }
        if (name === 'model') {
            const currentBrandId = currentItem.brandId;
            if (value && currentBrandId) {
                const suggestions = models.filter(m => m.brand_id === currentBrandId && m.model.toLowerCase().includes(value.toLowerCase()));
                setModelSuggestions(suggestions);
            } else { setModelSuggestions([]); }
        }
    };

    const selectSuggestion = (field, suggestion) => {
        if (field === 'brand') {
            setCurrentItem(prev => ({ ...prev, brand: suggestion.name, brandId: suggestion.id, model: '' }));
            setBrandSuggestions([]); setModelSuggestions([]); modelInputRef.current.focus();
        }
        if (field === 'model') {
            setCurrentItem(prev => ({ ...prev, model: suggestion.model, modelId: suggestion.id }));
            setModelSuggestions([]); sizeInputRef.current.focus();
        }
    };

    const handleKeyDown = (e, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const fieldRefs = { brand: modelInputRef, model: sizeInputRef, size: colorInputRef, color: skuInputRef, sku: priceInputRef, price: quantityInputRef, quantity: addButtonRef };
            const suggestions = { brand: brandSuggestions, model: modelSuggestions };
            if (suggestions[field]?.length > 0) { selectSuggestion(field, suggestions[field][0]); }
            else { fieldRefs[field]?.current.focus(); }
        }
    };

    const handleAddItem = async () => {
        if (!currentItem.brand || !currentItem.model || !currentItem.size || !currentItem.color || !currentItem.price) {
            alert('Por favor, completa todos los campos del producto, excepto SKU.'); return;
        }
        
        const { data: productData } = await supabase.from('products').select('id, category').eq('model', currentItem.model).eq('brand_id', currentItem.brandId).single();
        if (!productData) {
            if (window.confirm("Este modelo no existe en el inventario. ¿Deseas agregarlo a la venta de todos modos?")) {
                setCart(prev => [...prev, { ...currentItem, id: Date.now(), in_stock: false, category: 'N/A' }]);
                setCurrentItem({ brand: '', model: '', size: '', color: '', price: '', quantity: 1, sku: '' });
                brandInputRef.current.focus();
            }
            return;
        }

        const { data: variantData, error } = await supabase.from('variants').select('id, stock').eq('product_id', productData.id).eq('color', currentItem.color).eq('size', currentItem.size).single();
        if (error || !variantData) {
            if (window.confirm("Esta variante (color/talla) no existe en el inventario. ¿Deseas agregarla a la venta de todos modos?")) {
                setCart(prev => [...prev, { ...currentItem, id: Date.now(), in_stock: false, category: productData.category }]);
                setCurrentItem({ brand: '', model: '', size: '', color: '', price: '', quantity: 1, sku: '' });
                brandInputRef.current.focus();
            }
            return;
        }

        if (variantData.stock < currentItem.quantity) {
            alert(`Stock insuficiente. Solo quedan ${variantData.stock} pares.`); return;
        }

        setCart(prev => [...prev, { ...currentItem, variant_id: variantData.id, id: Date.now(), in_stock: true, category: productData.category }]);
        setCurrentItem({ brand: '', model: '', size: '', color: '', price: '', quantity: 1, sku: '' });
        brandInputRef.current.focus();
    };

    const handleRemoveItem = (itemId) => { setCart(cart.filter(item => item.id !== itemId)); };
    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);
    const totalPaid = parseFloat(amountPaid.efectivo || 0) + parseFloat(amountPaid.transferencia || 0);
    const changeDue = totalPaid > cartTotal ? totalPaid - cartTotal : 0;

    const handleFinalizeClick = () => {
        if (cart.length === 0) { alert("No hay productos en la nota."); return; }
        setAmountPaid({ efectivo: cartTotal, transferencia: 0 });
        setModalStep('payment'); setIsPaymentModalOpen(true);
    };

    const handleGoToConfirmation = (e) => {
        if(e) e.preventDefault();
        if(totalPaid < cartTotal) { alert("El monto pagado es menor al total."); return; }
        setModalStep('confirmation');
    };

    const executeSale = async () => {
        setLoading(true);
        const cart_items = cart.filter(item => item.in_stock).map(item => ({ variant_id: item.variant_id, quantity: parseInt(item.quantity, 10), price_at_sale: parseFloat(item.price) }));
        const finalSaleTimestamp = new Date(saleDate);
        finalSaleTimestamp.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

        let saleId = null;

        if (cart_items.length > 0) {
            const { data, error } = await supabase.rpc('process_sale_final', { cart_items, p_sale_timestamp: finalSaleTimestamp.toISOString() });
            if (error) { alert('Error al registrar la venta: ' + error.message); setLoading(false); return; }
            saleId = data;
        } else {
            saleId = 'TEMP-' + Date.now();
            alert("Venta registrada localmente (sin afectación de inventario).");
        }
        
        setLastSaleData({ id: saleId, cart: cart, total: cartTotal, timestamp: finalSaleTimestamp.toISOString() });
        setIsPaymentModalOpen(false);
        setIsTicketModalOpen(true);
        setCart([]);
        if (onSaleComplete) { onSaleComplete(); }
        setLoading(false);
    };
    
    const handlePaymentAmountChange = (e) => {
        const { name, value } = e.target;
        setAmountPaid(prev => ({...prev, [name]: value}));
    };
    
    const closeTicketModal = () => {
        setIsTicketModalOpen(false);
        setLastSaleData(null);
    };

    return (
        <>
            <div className="nota-container">
                <div className="header-buttons"><Link to="/admin" className="header-button admin">Administrador</Link><Link to="/inventario" className="header-button inventory">Consultar Inventario</Link></div>
                <header className="nota-header"><h1>Nota de Venta</h1></header>
                <div className="sale-date-picker"><FiCalendar /><label htmlFor="saleDate">Fecha de la Venta:</label><input type="date" id="saleDate" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} /></div>
                <div className="item-entry-form">
                    <div className="form-fields-grid">
                        <div className="form-row">
                            <div className="input-group autocomplete-wrapper"><label>Marca</label><input ref={brandInputRef} name="brand" value={currentItem.brand} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'brand')} />{brandSuggestions.length > 0 && (<ul className="suggestions-list">{brandSuggestions.map(b => <li key={b.id} onClick={() => selectSuggestion('brand', b)}>{b.name}</li>)}</ul>)}</div>
                            <div className="input-group autocomplete-wrapper"><label>Modelo</label><input ref={modelInputRef} name="model" value={currentItem.model} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'model')} />{modelSuggestions.length > 0 && (<ul className="suggestions-list">{modelSuggestions.map(m => <li key={m.id} onClick={() => selectSuggestion('model', m)}>{m.model}</li>)}</ul>)}</div>
                            <div className="input-group"><label>Número</label><input ref={sizeInputRef} name="size" value={currentItem.size} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'size')} /></div>
                        </div>
                        <div className="form-row">
                            <div className="input-group"><label>Color</label><input ref={colorInputRef} name="color" value={currentItem.color} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'color')} /></div>
                            <div className="input-group"><label>SKU (Opcional)</label><input ref={skuInputRef} name="sku" value={currentItem.sku} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'sku')} /></div>
                            <div className="input-group"><label>Precio</label><input ref={priceInputRef} name="price" type="number" value={currentItem.price} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'price')} /></div>
                            <div className="input-group"><label>Cant.</label><input ref={quantityInputRef} name="quantity" type="number" min="1" value={currentItem.quantity} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 'quantity')} /></div>
                        </div>
                    </div>
                    <div className="add-button-wrapper"><button ref={addButtonRef} onClick={handleAddItem} className="add-item-button">+</button></div>
                </div>
                <div className="nota-items">
                    <div className="nota-items-header"><span>Cant.</span><span>SKU</span><span>Marca</span><span>Modelo</span><span>#</span><span>Color</span><span>Categoría</span><span>Precio</span><span>Subtotal</span><span>Acción</span></div>
                    {cart.map(item => (
                        <div key={item.id} className={`nota-item-row ${!item.in_stock ? 'not-in-stock' : ''}`}>
                            <span>{item.quantity}</span><span>{item.sku || '-'}</span><span>{item.brand}</span><span>{item.model}</span><span>{item.size}</span><span>{item.color}</span><span className="category-cell">{item.category}{!item.in_stock && <FiAlertCircle title="No en inventario" />}</span><span>${parseFloat(item.price || 0).toFixed(2)}</span><span>${(item.quantity * item.price).toFixed(2)}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="remove-item-button"><FiTrash2 /></button>
                        </div>
                    ))}
                </div>
                <div className="nota-footer"><div className="total-display">Total: <strong>${cartTotal.toFixed(2)}</strong></div><button onClick={handleFinalizeClick} className="primary-button checkout-button" disabled={cart.length === 0}>Finalizar Venta</button></div>
            </div>
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={modalStep === 'payment' ? 'Finalizar Venta' : 'Confirmar Operación'}>
                {modalStep === 'payment' ? (<form onSubmit={handleGoToConfirmation} className="payment-modal"><div className="payment-summary"><span>Total a Pagar:</span><span className="total-amount">${cartTotal.toFixed(2)}</span></div><div className="payment-method-selector"><button type="button" onClick={() => setPaymentMethod('efectivo')} className={paymentMethod === 'efectivo' ? 'active' : ''}>Efectivo</button><button type="button" onClick={() => setPaymentMethod('transferencia')} className={paymentMethod === 'transferencia' ? 'active' : ''}>Transferencia</button><button type="button" onClick={() => setPaymentMethod('ambos')} className={paymentMethod === 'ambos' ? 'active' : ''}>Ambos</button></div><div className="payment-inputs">{(paymentMethod === 'efectivo' || paymentMethod === 'ambos') && (<div className="input-group"><label htmlFor="efectivo">Paga con (Efectivo):</label><input id="efectivo" name="efectivo" type="number" value={amountPaid.efectivo} onChange={handlePaymentAmountChange} /></div>)}{(paymentMethod === 'transferencia' || paymentMethod === 'ambos') && (<div className="input-group"><label htmlFor="transferencia">Monto (Transferencia):</label><input id="transferencia" name="transferencia" type="number" value={amountPaid.transferencia} onChange={handlePaymentAmountChange} /></div>)}</div><button type="submit" className="primary-button confirm-payment-button">Revisar Venta</button></form>) : (<div className="confirmation-modal"><h4>Resumen de la Operación</h4><div className="summary-line"><span>Total de la Venta:</span> <strong>${cartTotal.toFixed(2)}</strong></div><div className="summary-line"><span>Pagado en Efectivo:</span> <span>${parseFloat(amountPaid.efectivo || 0).toFixed(2)}</span></div><div className="summary-line"><span>Pagado por Transferencia:</span> <span>${parseFloat(amountPaid.transferencia || 0).toFixed(2)}</span></div><hr /><div className="summary-line total"><span>Total Pagado:</span> <strong>${totalPaid.toFixed(2)}</strong></div><div className="summary-line change"><span>Cambio a Devolver:</span> <strong>${changeDue.toFixed(2)}</strong></div><div className="confirmation-buttons"><button onClick={() => setModalStep('payment')} className="secondary-button">Regresar</button><button onClick={executeSale} className="primary-button" disabled={loading}>{loading ? 'Registrando...' : 'Confirmar y Registrar Venta'}</button></div></div>)}
            </Modal>
            <TicketModal isOpen={isTicketModalOpen} onClose={closeTicketModal} saleData={lastSaleData} />
        </>
    );
};

export default RegisterSale;
