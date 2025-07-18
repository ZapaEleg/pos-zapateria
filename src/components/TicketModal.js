import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importamos la función directamente
import Modal from './Modal';
import { FiDownload, FiShare2 } from 'react-icons/fi';
import './TicketModal.css';

const TicketModal = ({ isOpen, onClose, saleData }) => {
    const [clientPhone, setClientPhone] = useState('');

    if (!isOpen) return null;

    const generatePdf = () => {
        try {
            // SOLUCIÓN: Creamos una nueva instancia de jsPDF
            const doc = new jsPDF();
            
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('La Elegancia Zapaterías', 105, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Av. Felipe Berriozabal Mz 6 Lt 10 Bx, Altavilla Ctl, Santa Elena', 105, 27, { align: 'center' });
            doc.text('NOTA DE VENTA', 105, 34, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Fecha: ${new Date(saleData.timestamp).toLocaleDateString('es-MX')}`, 15, 45);
            doc.text(`Nota No: ${saleData.id}`, 195, 45, { align: 'right' });

            const tableColumn = ["Cant.", "Descripción", "Precio", "Importe"];
            const tableRows = [];

            saleData.cart.forEach(item => {
                const description = `${item.brand} ${item.model} ${item.color} #${item.size}`;
                const price = parseFloat(item.price || 0);
                const itemData = [
                    item.quantity,
                    description,
                    `$${price.toFixed(2)}`,
                    `$${(price * item.quantity).toFixed(2)}`
                ];
                tableRows.push(itemData);
            });

            // SOLUCIÓN: Usamos la función importada directamente sobre la instancia 'doc'
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 55,
                theme: 'grid',
                headStyles: { fillColor: [34, 49, 63] },
            });

            const finalY = doc.lastAutoTable.finalY;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', 140, finalY + 10);
            doc.text(`$${saleData.total.toFixed(2)}`, 195, finalY + 10, { align: 'right' });

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('¡Gracias por su compra!', 105, doc.internal.pageSize.height - 10, { align: 'center' });

            doc.save(`Nota_Venta_${saleData.id}.pdf`);
        } catch (error) {
            console.error("Error detallado al generar el PDF:", error);
            alert("Hubo un error al generar el ticket en PDF. Por favor, intente de nuevo o revise la consola para más detalles.");
        }
    };

    const shareOnWhatsApp = () => {
        if (!clientPhone) {
            alert('Por favor, ingresa el número de teléfono del cliente.');
            return;
        }
        const formattedPhone = `521${clientPhone.replace(/\D/g, '')}`;

        let message = `*Nota de Venta - La Elegancia Zapaterías*\n`;
        message += `*Folio:* ${saleData.id}\n`;
        message += `*Fecha:* ${new Date(saleData.timestamp).toLocaleDateString('es-MX')}\n\n`;
        message += '*Detalles de su compra:*\n';
        saleData.cart.forEach(item => {
            const price = parseFloat(item.price || 0);
            message += `- ${item.quantity}x ${item.brand} ${item.model} (#${item.size}) = $${(price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*TOTAL: $${saleData.total.toFixed(2)}*`;
        
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Venta Registrada con Éxito">
            <div className="ticket-modal-content">
                <h4>¿Qué deseas hacer a continuación?</h4>
                <p>La venta con ID <strong>#{saleData.id}</strong> ha sido registrada.</p>
                
                <div className="ticket-actions">
                    <button onClick={generatePdf} className="action-button download">
                        <FiDownload /> Descargar Ticket (PDF)
                    </button>
                    <div className="whatsapp-share-group">
                        <input type="tel" placeholder="Número de WhatsApp del cliente" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                        <button onClick={shareOnWhatsApp} className="action-button whatsapp"><FiShare2 /> Enviar</button>
                    </div>
                </div>
                <button onClick={onClose} className="secondary-button">Cerrar</button>
            </div>
        </Modal>
    );
};

export default TicketModal;

