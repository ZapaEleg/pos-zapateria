import React from 'react';
import './TicketModal.css';

const paymentTypeLabel = (type, efectivo, transferencia) => {
  if (type === "cash") return `Efectivo $${Number(efectivo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  if (type === "transfer") return `Transferencia $${Number(transferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  if (type === "both") return `Efectivo $${Number(efectivo).toLocaleString('es-MX', { minimumFractionDigits: 2 })} + Transferencia $${Number(transferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  return '';
};

const TicketModal = ({
  isOpen,
  onClose,
  saleData,
  customerPhone,
  customerName,
  paymentType,
  cashAmount = 0,
  transferAmount = 0,
}) => {
  if (!isOpen || !saleData) return null;

  const { cart, total, timestamp, isApartado, anticipo, restante, expiraEl } = saleData;

  return (
    <div className="ticket-modal-bg">
      <div className="ticket-modal-panel">
        <div className="ticket-header">
          <div className="ticket-logo">ZapaEleg</div>
          <div className="ticket-title">Recibo de Venta</div>
        </div>
        <div className="ticket-info">
          <div>
            <strong>Fecha:</strong> {new Date(timestamp).toLocaleDateString('es-MX')}
          </div>
          <div>
            <strong>Cliente:</strong> {customerName || "-"}
          </div>
          <div>
            <strong>Tel:</strong> {customerPhone || "-"}
          </div>
        </div>
        <div className="ticket-body">
          <table className="ticket-products">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Producto</th>
                <th>Talla</th>
                <th>PU</th>
                <th>Desc.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.quantity}</td>
                  <td>
                    <div><b>{item.brand} {item.model} {item.color}</b></div>
                    <div style={{fontSize:'0.88em', color:'#888'}}>SKU: {item.sku}</div>
                  </td>
                  <td>{item.size}</td>
                  <td>${Number(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td>${Number(item.discount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td>${(item.quantity * item.final_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ticket-summary">
            <div>
              <span>Subtotal:</span>
              <span>
                $
                {cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span>Descuento total:</span>
              <span>
                $
                {cart.reduce((acc, item) => acc + (Number(item.discount) || 0) * (Number(item.quantity) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="ticket-total">
              <span>Total:</span>
              <span>
                $
                {Number(total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span>Método de pago:</span>
              <span><b>{paymentTypeLabel(paymentType, cashAmount, transferAmount)}</b></span>
            </div>
            {isApartado && (
              <>
                <div>
                  <span>Anticipo:</span>
                  <span>${Number(anticipo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span>Restante:</span>
                  <span>${Number(restante).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                {expiraEl && (
                  <div style={{color:'#c2410c', fontWeight:600}}>
                    Expira: {expiraEl}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="ticket-footer">
          <div>¡Gracias por tu compra!</div>
          <div className="ticket-qr">
            {/* Aquí puedes incluir un QR o branding */}
          </div>
        </div>
        <button className="primary-button" style={{margin:'16px 0 0 0'}} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TicketModal;