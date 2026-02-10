// const API_URL moved to config.js

function getInvoiceId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadInvoice() {
    const invoiceId = getInvoiceId();
    
    if (!invoiceId) {
        document.getElementById('invoice-container').innerHTML = '<p>Klaida: Sąskaita nerasta</p>';
        return;
    }
    
    try {
        const invoice = await API.invoices.getById(invoiceId);
        displayInvoice(invoice);
    } catch (error) {
        console.error('Klaida kraunant sąskaitą:', error);
        document.getElementById('invoice-container').innerHTML = '<p style="color: red;">Klaida kraunant sąskaitą: ' + error.message + '</p>';
    }
}

function displayInvoice(invoice) {
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('lt-LT');
    const dueDate = new Date(invoice.due_date).toLocaleDateString('lt-LT');
    
    let itemsHTML = '';
    invoice.items.forEach((item, index) => {
        const lineTotal = parseFloat(item.line_total);
        const price = parseFloat(item.price);
        
        let discountHTML = '-';
        if (item.discount_type === 'fixed' && item.discount_value > 0) {
            discountHTML = `-${parseFloat(item.discount_value).toFixed(2)} €`;
        } else if (item.discount_type === 'percent' && item.discount_value > 0) {
            const discountAmount = (item.quantity * price * item.discount_value / 100);
            discountHTML = `${item.discount_value}% (-${discountAmount.toFixed(2)} €)`;
        }
        
        itemsHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${item.product_name ? `<strong>${item.product_name}</strong><br>` : ''}
                    ${item.description}
                </td>
                <td>${item.quantity}</td>
                <td>${price.toFixed(2)} €</td>
                <td>${discountHTML}</td>
                <td><strong>${lineTotal.toFixed(2)} €</strong></td>
            </tr>
        `;
    });
    
    const html = `
        <div class="invoice-document">
            <div class="invoice-header">
                <h1><span class="no-print">📊 </span>PVM SĄSKAITA FAKTŪRA</h1>
                <p>Sąskaitos numeris: <strong>${invoice.invoice_number}</strong></p>
            </div>
            
            <div class="invoice-info">
                <div class="invoice-info-item">
                    <p><strong>Sąskaitos data:</strong> ${invoiceDate}</p>
                </div>
                <div class="invoice-info-item" style="text-align: right;">
                    <p><strong>Mokėjimo terminas:</strong> ${dueDate}</p>
                </div>
            </div>
            
            <div class="parties-section">
                <div class="party-box">
                    <h3><span class="no-print">📤 </span>Pardavėjas</h3>
                    <p><strong>Edgar Grinčuk</strong></p>
                    <p>Adresas: Saulėtoji 55 Jašiūnai</p>
                    <p>El. paštas: edgariukui@gmail.com</p>
                    <p>Tel: +370 600 86227</p>
                    <div style="margin-top: 20px; text-align: center;">
                        <span class="eg-signature">
                            <span class="eg-signature-text">ЭG</span>
                        </span>
                    </div>
                </div>
                
                <div class="party-box">
                    <h3><span class="no-print">📥 </span>Pirkėjas</h3>
                    <p><strong>${invoice.company_name || 'Nežinomas klientas'}</strong></p>
                    ${invoice.company_code ? `<p>Įmonės kodas: ${invoice.company_code}</p>` : ''}
                    ${invoice.vat_code ? `<p>PVM kodas: ${invoice.vat_code}</p>` : ''}
                    ${invoice.address ? `<p>Adresas: ${invoice.address}</p>` : ''}
                    ${(invoice.city || invoice.postal_code) ? `<p>${invoice.city || ''} ${invoice.postal_code || ''}</p>` : ''}
                    ${invoice.email ? `<p>El. paštas: ${invoice.email}</p>` : ''}
                    ${invoice.phone ? `<p>Tel: ${invoice.phone}</p>` : ''}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Prekės pavadinimas</th>
                        <th>Kiekis</th>
                        <th>Kaina</th>
                        <th>Nuolaida</th>
                        <th>Suma</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
                <tfoot>
                    ${invoice.shipping_price > 0 ? `
                        <tr>
                            <td colspan="5" style="text-align: right;">Transportavimo kaina:</td>
                            <td><strong>${parseFloat(invoice.shipping_price).toFixed(2)} €</strong></td>
                        </tr>
                    ` : ''}
                </tfoot>
            </table>
            
            <div class="totals-section">
                <div class="total-row">
                    <span>Suma be PVM:</span>
                    <strong>${parseFloat(invoice.subtotal).toFixed(2)} €</strong>
                </div>
                <div class="total-row">
                    <span>PVM (21%):</span>
                    <strong>${parseFloat(invoice.vat_amount).toFixed(2)} €</strong>
                </div>
                <div class="total-row grand-total">
                    <span>VISO SU PVM:</span>
                    <strong>${parseFloat(invoice.total).toFixed(2)} €</strong>
                </div>
            </div>
            
            <div class="invoice-footer">
                <p>Ačiū už bendradarbiavimą!</p>
                <p>Sugeneruota: ${new Date().toLocaleDateString('lt-LT')} ${new Date().toLocaleTimeString('lt-LT')}</p>
            </div>
        </div>
    `;
    
    document.getElementById('invoice-container').innerHTML = html;
}

function editInvoice() {
    const invoiceId = getInvoiceId();
    window.location.href = `edit-invoice.html?id=${invoiceId}`;
}

async function deleteInvoice() {
    const invoiceId = getInvoiceId();
    
    if (!confirm('Ar tikrai norite ištrinti šią sąskaitą? Šis veiksmas negrįžtamas!')) {
        return;
    }
    
    try {
        await API.invoices.delete(invoiceId);
        alert('✅ Sąskaita ištrinta sėkmingai!');
        window.location.href = 'invoices.html';
    } catch (error) {
        console.error('Klaida trinant sąskaitą:', error);
        alert('❌ Nepavyko ištrinti sąskaitos: ' + error.message);
    }
}

function copyPublicLink() {
    const invoiceId = getInvoiceId();
    const publicUrl = `${window.location.origin}/pages/public-invoice.html?id=${invoiceId}`;
    
    navigator.clipboard.writeText(publicUrl).then(() => {
        alert('✅ Nuoroda nukopijuota!');
    }).catch(() => {
        prompt('Nukopijuokite šią nuorodą:', publicUrl);
    });
}

document.addEventListener('DOMContentLoaded', loadInvoice);