const API_URL = '/api';  // Relative path

// Gauti visas sąskaitas
async function loadInvoices() {
    try {
        const response = await fetch(`${API_URL}/invoices`);
        const invoices = await response.json();
        displayInvoices(invoices);
    } catch (error) {
        console.error('Klaida kraunant sąskaitas:', error);
        document.getElementById('invoices-list').innerHTML = '<p style="color: red;">Klaida kraunant sąskaitas</p>';
    }
}

// Rodyti sąskaitas lentelėje
function displayInvoices(invoices) {
    const container = document.getElementById('invoices-list');
    
    if (invoices.length === 0) {
        container.innerHTML = '<p>Sąskaitų sąrašas tuščias. Sukurkite pirmą sąskaitą!</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Sąskaitos Nr.</th>
                    <th>Klientas</th>
                    <th>Data</th>
                    <th>Mokėjimo terminas</th>
                    <th>Suma be PVM</th>
                    <th>PVM</th>
                    <th>Viso su PVM</th>
                    <th>Statusas</th>
                    <th>Veiksmai</th>
                </tr>
            </thead>
            <tbody>
    `;

    invoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('lt-LT');
        const dueDate = new Date(invoice.due_date).toLocaleDateString('lt-LT');
        const statusBadge = getStatusBadge(invoice.status);
        
        html += `
            <tr>
                <td><strong>${invoice.invoice_number}</strong></td>
                <td>${invoice.client_name || 'Nežinomas klientas'}</td>
                <td>${invoiceDate}</td>
                <td>${dueDate}</td>
                <td>${parseFloat(invoice.subtotal).toFixed(2)} €</td>
                <td>${parseFloat(invoice.vat_amount).toFixed(2)} €</td>
                <td><strong>${parseFloat(invoice.total).toFixed(2)} €</strong></td>
                <td>${statusBadge}</td>
                <td class="actions">
                    <button class="btn btn-small" onclick="viewInvoice(${invoice.id})">👁️ Peržiūrėti</button>
                    <button class="btn btn-small btn-danger" onclick="deleteInvoice(${invoice.id}, '${invoice.invoice_number}')">🗑️ Trinti</button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Gauti statuso badge
function getStatusBadge(status) {
    const badges = {
        'unpaid': '<span style="background: #f85032; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.9em;">Neapmokėta</span>',
        'paid': '<span style="background: #11998e; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.9em;">Apmokėta</span>',
        'overdue': '<span style="background: #8B4513; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.9em;">Uždelsta</span>'
    };
    return badges[status] || status;
}

// Peržiūrėti sąskaitą
function viewInvoice(id) {
    window.location.href = `view-invoice.html?id=${id}`;
}

// Ištrinti sąskaitą
async function deleteInvoice(id, invoiceNumber) {
    if (!confirm(`Ar tikrai norite ištrinti sąskaitą "${invoiceNumber}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Sąskaita ištrinta!');
            loadInvoices();
        } else {
            alert('Klaida trinant sąskaitą');
        }
    } catch (error) {
        console.error('Klaida:', error);
        alert('Klaida trinant sąskaitą');
    }
}

// Krauname sąskaitas kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', loadInvoices);