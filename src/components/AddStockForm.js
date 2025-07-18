import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import './AddStockForm.css';

const SIZE_RANGES = {
    "12-14.5": { start: 12, end: 14.5 }, "15-17.5": { start: 15, end: 17.5 },
    "18-21.5": { start: 18, end: 21.5 }, "22-26.5": { start: 22, end: 26.5 },
    "25-29.5": { start: 25, end: 29.5 },
};

const AddStockForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generalInfo, setGeneralInfo] = useState({
        brand: '', model: '', color: '', category: 'niña',
        totalQuantity: '', price: '', sizeRange: Object.keys(SIZE_RANGES)[0]
    });
    const [sizeDistribution, setSizeDistribution] = useState({});
    const [sortedSizes, setSortedSizes] = useState([]);

    // Referencias para la navegación con Enter
    const fieldRefs = useRef({});
    const sizeInputRefs = useRef({});

    const generateSizes = (rangeKey) => {
        const { start, end } = SIZE_RANGES[rangeKey];
        const sizes = [];
        for (let i = start; i <= end; i += 0.5) { sizes.push(i); }
        return sizes;
    };

    const handleNextStep = () => {
        if (!generalInfo.brand || !generalInfo.model || !generalInfo.color || !generalInfo.totalQuantity || !generalInfo.price) {
            alert('Por favor, completa toda la información general.');
            return;
        }
        const sizes = generateSizes(generalInfo.sizeRange);
        const initialDistribution = {};
        sizes.forEach(size => { initialDistribution[String(size)] = 0; });
        
        setSortedSizes(sizes); // Guardamos las tallas ordenadas
        setSizeDistribution(initialDistribution);
        setIsModalOpen(true);
    };

    const handleDistributionChange = (size, quantity) => {
        setSizeDistribution(prev => ({ ...prev, [size]: parseInt(quantity, 10) || 0 }));
    };

    const handleSaveStock = async () => {
        setLoading(true);
        const distributedTotal = Object.values(sizeDistribution).reduce((sum, qty) => sum + qty, 0);

        if (distributedTotal !== parseInt(generalInfo.totalQuantity, 10)) {
            alert('La cantidad distribuida no coincide con la cantidad total.');
            setLoading(false);
            return;
        }

        try {
            let { data: brandData } = await supabase.from('brands').select('id').eq('name', generalInfo.brand.trim()).single();
            if (!brandData) {
                const { data: newBrand, error } = await supabase.from('brands').insert({ name: generalInfo.brand.trim() }).select().single();
                if (error) throw error;
                brandData = newBrand;
            }

            let { data: productData } = await supabase.from('products').select('id').eq('model', generalInfo.model.trim()).eq('brand_id', brandData.id).single();
            if (!productData) {
                const { data: newProduct, error } = await supabase.from('products').insert({ model: generalInfo.model.trim(), brand_id: brandData.id, category: generalInfo.category }).select().single();
                if (error) throw error;
                productData = newProduct;
            }

            const variants_to_update = Object.entries(sizeDistribution)
                .filter(([size, stock]) => stock > 0)
                .map(([size, stock]) => ({
                    product_id: productData.id,
                    color: generalInfo.color.trim(),
                    size: parseFloat(size),
                    price: parseFloat(generalInfo.price),
                    stock_change: stock,
                    sku: `${generalInfo.brand.substring(0, 3)}-${generalInfo.model}-${size}`.toUpperCase()
                }));

            if (variants_to_update.length > 0) {
                const { error: batchError } = await supabase.rpc('upsert_stock_batch', { variants_to_update });
                if (batchError) throw batchError;
            }

            alert('¡Stock añadido con éxito!');
            setIsModalOpen(false);
            setGeneralInfo({ brand: '', model: '', color: '', category: 'niña', totalQuantity: '', price: '', sizeRange: '12-14.5' });

        } catch (error) {
            alert('Error al guardar el stock: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e, fieldName) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const fieldOrder = ['brand', 'model', 'color', 'category', 'totalQuantity', 'price', 'sizeRange', 'distributeButton'];
            const currentIndex = fieldOrder.indexOf(fieldName);
            const nextField = fieldRefs.current[fieldOrder[currentIndex + 1]];
            if (nextField) {
                nextField.focus();
            }
        }
    };

    const handleSizeKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextSize = sortedSizes[index + 1];
            const nextInput = sizeInputRefs.current[nextSize];
            if (nextInput) {
                nextInput.focus();
            } else {
                // Si es el último, enfocar el botón de guardar
                fieldRefs.current['saveButton']?.focus();
            }
        }
    };

    const distributedTotal = Object.values(sizeDistribution).reduce((sum, qty) => sum + qty, 0);

    return (
        <>
            <div className="add-stock-container">
                <h3>Añadir Nuevo Stock al Inventario</h3>
                <div className="stock-entry-form">
                    <div className="input-group"><label>Marca</label><input ref={el => fieldRefs.current['brand'] = el} name="brand" value={generalInfo.brand} onKeyDown={(e) => handleKeyDown(e, 'brand')} onChange={(e) => setGeneralInfo({...generalInfo, brand: e.target.value})} /></div>
                    <div className="input-group"><label>Modelo</label><input ref={el => fieldRefs.current['model'] = el} name="model" value={generalInfo.model} onKeyDown={(e) => handleKeyDown(e, 'model')} onChange={(e) => setGeneralInfo({...generalInfo, model: e.target.value})} /></div>
                    <div className="input-group"><label>Color</label><input ref={el => fieldRefs.current['color'] = el} name="color" value={generalInfo.color} onKeyDown={(e) => handleKeyDown(e, 'color')} onChange={(e) => setGeneralInfo({...generalInfo, color: e.target.value})} /></div>
                    <div className="input-group"><label>Categoría</label><select ref={el => fieldRefs.current['category'] = el} name="category" value={generalInfo.category} onKeyDown={(e) => handleKeyDown(e, 'category')} onChange={(e) => setGeneralInfo({...generalInfo, category: e.target.value})}><option value="niña">Niña</option><option value="niño">Niño</option><option value="dama">Dama</option><option value="caballero">Caballero</option></select></div>
                    <div className="input-group"><label>Cantidad Total</label><input ref={el => fieldRefs.current['totalQuantity'] = el} type="number" name="totalQuantity" value={generalInfo.totalQuantity} onKeyDown={(e) => handleKeyDown(e, 'totalQuantity')} onChange={(e) => setGeneralInfo({...generalInfo, totalQuantity: e.target.value})} /></div>
                    <div className="input-group"><label>Precio Venta</label><input ref={el => fieldRefs.current['price'] = el} type="number" name="price" value={generalInfo.price} onKeyDown={(e) => handleKeyDown(e, 'price')} onChange={(e) => setGeneralInfo({...generalInfo, price: e.target.value})} /></div>
                    <div className="input-group"><label>Rango de Tallas</label><select ref={el => fieldRefs.current['sizeRange'] = el} name="sizeRange" value={generalInfo.sizeRange} onKeyDown={(e) => handleKeyDown(e, 'sizeRange')} onChange={(e) => setGeneralInfo({...generalInfo, sizeRange: e.target.value})}>{Object.keys(SIZE_RANGES).map(range => <option key={range} value={range}>{range}</option>)}</select></div>
                </div>
                <button ref={el => fieldRefs.current['distributeButton'] = el} onClick={handleNextStep} className="primary-button full-width-button">Distribuir Tallas</button>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Distribuir Cantidad por Talla">
                <div className="size-distribution-modal">
                    <div className="distribution-summary"><p><strong>{generalInfo.brand} {generalInfo.model}</strong> - {generalInfo.color}</p><p>Total a distribuir: <strong>{generalInfo.totalQuantity}</strong> | Distribuido: <strong className={distributedTotal !== parseInt(generalInfo.totalQuantity, 10) ? 'error' : 'success'}>{distributedTotal}</strong></p></div>
                    <div className="distribution-grid">
                        {sortedSizes.map((size, index) => (
                            <div key={size} className="input-group">
                                <label>Talla {size}</label>
                                <input ref={el => sizeInputRefs.current[size] = el} type="number" min="0" value={sizeDistribution[size] || 0} onKeyDown={(e) => handleSizeKeyDown(e, index)} onChange={(e) => handleDistributionChange(size, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <button ref={el => fieldRefs.current['saveButton'] = el} onClick={handleSaveStock} className="primary-button" disabled={loading || distributedTotal !== parseInt(generalInfo.totalQuantity, 10)}>
                        {loading ? 'Guardando...' : 'Guardar Stock'}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default AddStockForm;

