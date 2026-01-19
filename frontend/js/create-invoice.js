// const API_URL moved to config.js

let itemCounter = 0;
let clients = [];
let products = [];

// ========================================
// MODAL FUNCTIONS
// ========================================

function openAddClientModal() {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('add-client-modal').classList.add('active');
}

function openAddProductModal() {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('add-product-modal').classList.add('active');
}

function closeModals() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('add-client-modal').classList.remove('active');
    document.getElementById('add-product-modal').classList.remove('active');
}

// Refresh product dropdowns in all item rows
function refreshProductDropdowns() {
    let productOptions = '<option value="">-- Pasirinkite produktą arba įrašykite rankiniu būdu --</option>';
    products.forEach(product => {
        productOptions += `<option value="${product.id}" data-price="${product.price}" data-description="${product.description || ''}">${product.name} - ${product.price} €</option>`;
    });

    document.querySelectorAll('.product-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = productOptions;
        select.value = currentValue; // Restore previous selection
    });
}

// ========================================
// INITIALIZATION
// ========================================

// Inicializavimas
document.addEventListener('DOMContentLoaded', async () => {
    // Nustatyti šiandienos datą
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice_date').value = today;

    // Nustatyti mokėjimo terminą (14 dienų)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    document.getElementById('due_date').value = dueDate.toISOString().split('T')[0];

    // Krauname duomenis
    await loadClients();
    await loadProducts();

    // Pridėti pirmą prekės eilutę
    addItemRow();

    // Event listeners
    document.getElementById('add-item-btn').addEventListener('click', addItemRow);
    document.getElementById('invoice-form').addEventListener('submit', createInvoice);
    document.getElementById('client_id').addEventListener('change', showClientDetails);
    document.getElementById('shipping_price').addEventListener('input', calculateTotals);

    // Quick Add Client Form
    document.getElementById('quick-add-client-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientData = {
            company_name: document.getElementById('modal-company-name').value,
            company_code: document.getElementById('modal-company-code').value,
            vat_code: document.getElementById('modal-vat-code').value,
            address: document.getElementById('modal-address').value,
            city: document.getElementById('modal-city').value,
            postal_code: document.getElementById('modal-postal-code').value,
            country: 'Lietuva',
            email: document.getElementById('modal-email').value,
            phone: document.getElementById('modal-phone').value
        };

        try {
            const response = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });

            if (response.ok) {
                const newClient = await response.json();

                // Refresh clients list
                await loadClients();

                // Select the new client
                document.getElementById('client_id').value = newClient.id;
                showClientDetails();

                // Close modal and reset form
                closeModals();
                document.getElementById('quick-add-client-form').reset();

                alert('✅ Klientas pridėtas!');
            } else {
                alert('❌ Klaida pridedant klientą');
            }
        } catch (error) {
            console.error('Klaida:', error);
            alert('❌ Klaida pridedant klientą');
        }
    });

    // Quick Add Product Form
    document.getElementById('quick-add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('modal-product-name').value,
            description: document.getElementById('modal-product-description').value,
            price: parseFloat(document.getElementById('modal-product-price').value),
            unit: document.getElementById('modal-product-unit').value
        };

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const newProduct = await response.json();

                // Refresh products list
                await loadProducts();

                // Refresh all product dropdowns in items
                refreshProductDropdowns();

                // Close modal and reset form
                closeModals();
                document.getElementById('quick-add-product-form').reset();

                alert('✅ Produktas pridėtas!');
            } else {
                alert('❌ Klaida pridedant produktą');
            }
        } catch (error) {
            console.error('Klaida:', error);
            alert('❌ Klaida pridedant produktą');
        }
    });
});

// Krauname klientus
async function loadClients() {
    try {
        const response = await fetch(`${API_URL}/clients`);
        clients = await response.json();

        const select = document.getElementById('client_id');
        select.innerHTML = '<option value="">-- Pasirinkite klientą --</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.company_name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Klaida kraunant klientus:', error);
    }
}

// Krauname produktus
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
    } catch (error) {
        console.error('Klaida kraunant produktus:', error);
    }
}

// Rodyti kliento detales
function showClientDetails() {
    const clientId = document.getElementById('client_id').value;
    const clientDetails = document.getElementById('client-details');

    if (!clientId) {
        clientDetails.style.display = 'none';
        return;
    }

    const client = clients.find(c => c.id == clientId);
    if (client) {
        document.getElementById('client-company').textContent = client.company_name;
        document.getElementById('client-code').textContent = client.company_code || '-';
        document.getElementById('client-vat').textContent = client.vat_code || '-';
        document.getElementById('client-address').textContent =
            `${client.address || ''}, ${client.city || ''} ${client.postal_code || ''}`.trim();
        clientDetails.style.display = 'block';
    }
}

// Pridėti prekės eilutę
function addItemRow() {
    itemCounter++;
    const container = document.getElementById('items-container');

    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.id = `item-${itemCounter}`;

    // Produktų dropdown options
    let productOptions = '<option value="">-- Pasirinkite produktą arba įrašykite rankiniu būdu --</option>';
    products.forEach(product => {
        productOptions += `<option value="${product.id}" data-price="${product.price}" data-description="${product.description || ''}">${product.name} - ${product.price} €</option>`;
    });

    itemRow.innerHTML = `
        <h3>Prekė #${itemCounter}</h3>
        <button type="button" class="remove-item-btn" onclick="removeItem(${itemCounter})">✖ Pašalinti</button>
        
        <div class="form-group">
            <label>Pasirinkite produktą (arba įrašykite rankiniu būdu žemiau)</label>
            <select class="product-select" data-item="${itemCounter}">
                ${productOptions}
            </select>
        </div>
        
        <div class="form-group">
            <label>Aprašymas *</label>
            <input type="text" class="item-description" data-item="${itemCounter}" required>
        </div>
        
        <div style="display: flex; gap: 15px;">
            <div class="form-group" style="flex: 1;">
                <label>Kiekis *</label>
                <input type="number" class="item-quantity" data-item="${itemCounter}" min="1" value="1" required>
            </div>
            
            <div class="form-group" style="flex: 1;">
                <label>Kaina (EUR) *</label>
                <input type="number" class="item-price" data-item="${itemCounter}" step="0.01" min="0" required>
            </div>
            
            <div class="form-group" style="flex: 1;">
                <label>Nuolaida</label>
                <select class="item-discount-type" data-item="${itemCounter}">
                    <option value="">Nėra</option>
                    <option value="fixed">Fiksuota (EUR)</option>
                    <option value="percent">Procentinė (%)</option>
                </select>
            </div>
            
            <div class="form-group" style="flex: 1;">
                <label>Nuolaidos dydis</label>
                <input type="number" class="item-discount-value" data-item="${itemCounter}" step="0.01" min="0" value="0">
            </div>
        </div>
        
        <div class="form-group" style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Suma be PVM:</span>
        <strong><span class="item-subtotal" data-item="${itemCounter}">0.00 €</span></strong>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>PVM (21%):</span>
        <strong><span class="item-vat" data-item="${itemCounter}">0.00 €</span></strong>
    </div>
    <div style="display: flex; justify-content: space-between; border-top: 2px solid #dee2e6; padding-top: 5px;">
        <span style="font-size: 1.1em;">Viso su PVM:</span>
        <strong style="font-size: 1.1em; color: #11998e;"><span class="item-total" data-item="${itemCounter}">0.00 €</span></strong>
    </div>
</div>
    `;

    container.appendChild(itemRow);

    // Event listeners
    const productSelect = itemRow.querySelector('.product-select');
    productSelect.addEventListener('change', (e) => fillProductData(e.target));

    const inputs = itemRow.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotals);
        input.addEventListener('change', calculateTotals);
    });
}

// Užpildyti produkto duomenis
function fillProductData(select) {
    const itemId = select.dataset.item;
    const selectedOption = select.options[select.selectedIndex];

    if (select.value) {
        const price = selectedOption.dataset.price;
        const description = selectedOption.dataset.description || selectedOption.text.split(' - ')[0];

        document.querySelector(`.item-description[data-item="${itemId}"]`).value = description;
        document.querySelector(`.item-price[data-item="${itemId}"]`).value = price;

        calculateTotals();
    }
}

// Pašalinti prekę
function removeItem(itemId) {
    const item = document.getElementById(`item-${itemId}`);
    if (item) {
        item.remove();
        calculateTotals();
    }
}

// Apskaičiuoti sumas
function calculateTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.item-row').forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discountType = row.querySelector('.item-discount-type').value;
        const discountValue = parseFloat(row.querySelector('.item-discount-value').value) || 0;
        
        let itemSubtotal = quantity * price;
        
        // Atimti nuolaidą
        if (discountType === 'fixed') {
            itemSubtotal -= discountValue;
        } else if (discountType === 'percent') {
            itemSubtotal -= (itemSubtotal * discountValue / 100);
        }
        
        itemSubtotal = Math.max(0, itemSubtotal);
        
        // Apskaičiuoti PVM prekei
        const itemVat = itemSubtotal * 0.21;
        const itemTotal = itemSubtotal + itemVat;
        
        const itemId = row.querySelector('.item-quantity').dataset.item;
        
        // Atnaujinti prekės eilutės sumas
        const subtotalElement = row.querySelector(`.item-subtotal[data-item="${itemId}"]`);
        const vatElement = row.querySelector(`.item-vat[data-item="${itemId}"]`);
        const totalElement = row.querySelector(`.item-total[data-item="${itemId}"]`);
        
        if (subtotalElement) subtotalElement.textContent = itemSubtotal.toFixed(2) + ' €';
        if (vatElement) vatElement.textContent = itemVat.toFixed(2) + ' €';
        if (totalElement) totalElement.textContent = itemTotal.toFixed(2) + ' €';
        
        subtotal += itemSubtotal;
    });
    
    const shippingPrice = parseFloat(document.getElementById('shipping_price').value) || 0;
    subtotal += shippingPrice;
    
    const vatAmount = subtotal * 0.21;
    const total = subtotal + vatAmount;
    
    document.getElementById('subtotal-display').textContent = subtotal.toFixed(2) + ' €';
    document.getElementById('vat-display').textContent = vatAmount.toFixed(2) + ' €';
    document.getElementById('total-display').textContent = total.toFixed(2) + ' €';
}

// Sukurti sąskaitą
async function createInvoice(e) {
    e.preventDefault();

    // Surinkti duomenis
    const invoiceData = {
        invoice_number: document.getElementById('invoice_number').value,
        client_id: parseInt(document.getElementById('client_id').value),
        invoice_date: document.getElementById('invoice_date').value,
        due_date: document.getElementById('due_date').value,
        shipping_price: parseFloat(document.getElementById('shipping_price').value) || 0,
        items: []
    };

    // Surinkti prekių duomenis
    document.querySelectorAll('.item-row').forEach(row => {
        const productSelect = row.querySelector('.product-select');
        const item = {
            product_id: productSelect.value ? parseInt(productSelect.value) : null,
            description: row.querySelector('.item-description').value,
            quantity: parseInt(row.querySelector('.item-quantity').value),
            price: parseFloat(row.querySelector('.item-price').value),
            discount_type: row.querySelector('.item-discount-type').value || null,
            discount_value: parseFloat(row.querySelector('.item-discount-value').value) || 0
        };
        invoiceData.items.push(item);
    });

    // Siųsti į API
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`✅ Sąskaita sukurta! Numeris: ${result.invoice_number}`);
            window.location.href = 'invoices.html';
        } else {
            alert('❌ Klaida kuriant sąskaitą');
        }
    } catch (error) {
        console.error('Klaida:', error);
        alert('❌ Klaida kuriant sąskaitą');
    }
}