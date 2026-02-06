// const API_URL moved to config.js

let editingId = null;

// ========================================
// CLIENTS CRUD FUNKCIJOS
// ========================================

// Gauti visus klientus
async function loadClients() {
    try {
        const clients = await API.clients.getAll();
        displayClients(clients);
    } catch (error) {
        console.error('Klaida kraunant klientus:', error);
        alert('Nepavyko užkrauti klientų: ' + error.message);
    }
}

// Rodyti klientus lentelėje
function displayClients(clients) {
    const container = document.getElementById('clients-list');
    
    if (clients.length === 0) {
        container.innerHTML = '<p>Klientų sąrašas tuščias. Pridėkite pirmą klientą!</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Įmonė</th>
                    <th>Įmonės kodas</th>
                    <th>PVM kodas</th>
                    <th>Miestas</th>
                    <th>El. paštas</th>
                    <th>Telefonas</th>
                    <th>Veiksmai</th>
                </tr>
            </thead>
            <tbody>
    `;

    clients.forEach(client => {
        html += `
            <tr>
                <td><strong>${client.company_name}</strong></td>
                <td>${client.company_code || '-'}</td>
                <td>${client.vat_code || '-'}</td>
                <td>${client.city || '-'}</td>
                <td>${client.email || '-'}</td>
                <td>${client.phone || '-'}</td>
                <td class="actions">
                    <button class="btn btn-small" onclick="editClient(${client.id})">✏️ Redaguoti</button>
                    <button class="btn btn-small btn-danger" onclick="deleteClient(${client.id}, '${client.company_name}')">🗑️ Trinti</button>
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

// Redaguoti klientą
async function editClient(id) {
    try {
        const client = await API.clients.getById(id);

        // Užpildyti formą
        document.getElementById('company_name').value = client.company_name;
        document.getElementById('company_code').value = client.company_code || '';
        document.getElementById('vat_code').value = client.vat_code || '';
        document.getElementById('address').value = client.address || '';
        document.getElementById('city').value = client.city || '';
        document.getElementById('postal_code').value = client.postal_code || '';
        document.getElementById('country').value = client.country || 'Lietuva';
        document.getElementById('email').value = client.email || '';
        document.getElementById('phone').value = client.phone || '';

        editingId = id;
        document.querySelector('#client-form button[type="submit"]').textContent = 'Atnaujinti Klientą';
        document.getElementById('cancel-edit').style.display = 'inline-block';

        // Scroll į formą
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Klaida kraunant kliento duomenis:', error);
        alert('Nepavyko užkrauti kliento: ' + error.message);
    }
}

// Atšaukti redagavimą
function cancelEdit() {
    editingId = null;
    document.getElementById('client-form').reset();
    document.getElementById('country').value = 'Lietuva';
    document.querySelector('#client-form button[type="submit"]').textContent = 'Pridėti Klientą';
    document.getElementById('cancel-edit').style.display = 'none';
}

// Ištrinti klientą
async function deleteClient(id, name) {
    if (!confirm(`Ar tikrai norite ištrinti klientą "${name}"?`)) {
        return;
    }

    try {
        await API.clients.delete(id);
        alert('Klientas ištrintas sėkmingai!');
        loadClients();
    } catch (error) {
        console.error('Klaida trinant klientą:', error);
        alert('Nepavyko ištrinti kliento: ' + error.message);
    }
}

// Sukurti arba atnaujinti klientą
async function saveClient(e) {
    e.preventDefault();

    const clientData = {
        company_name: document.getElementById('company_name').value,
        company_code: document.getElementById('company_code').value,
        vat_code: document.getElementById('vat_code').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        postal_code: document.getElementById('postal_code').value,
        country: document.getElementById('country').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    try {
        if (editingId) {
            // UPDATE
            await API.clients.update(editingId, clientData);
            alert('Klientas atnaujintas sėkmingai!');
        } else {
            // CREATE
            await API.clients.create(clientData);
            alert('Klientas pridėtas sėkmingai!');
        }
        
        cancelEdit();
        loadClients();
    } catch (error) {
        console.error('Klaida išsaugant klientą:', error);
        alert('Nepavyko išsaugoti kliento: ' + error.message);
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    
    // Form submit
    document.getElementById('client-form').addEventListener('submit', saveClient);
    
    // Cancel edit button
    document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
});