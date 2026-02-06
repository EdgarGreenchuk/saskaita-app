// const API_URL moved to config.js

let editingProductId = null;

// Gauti visus produktus
async function loadProducts() {
    try {
        const products = await API.products.getAll();
        displayProducts(products);
    } catch (error) {
        console.error('Klaida kraunant produktus:', error);
        document.getElementById('products-list').innerHTML = '<p style="color: red;">Klaida kraunant produktus</p>';
    }
}

// Rodyti produktus lentelėje
function displayProducts(products) {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p>Produktų sąrašas tuščias. Pridėkite pirmą produktą!</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Pavadinimas</th>
                    <th>Aprašymas</th>
                    <th>Kaina</th>
                    <th>Vienetas</th>
                    <th>Veiksmai</th>
                </tr>
            </thead>
            <tbody>
    `;

    products.forEach(product => {
        html += `
            <tr>
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td>${product.description || '-'}</td>
                <td>${parseFloat(product.price).toFixed(2)} €</td>
                <td>${product.unit}</td>
                <td class="actions">
                    <button class="btn btn-small" onclick="editProduct(${product.id})">✏️ Redaguoti</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProduct(${product.id}, '${product.name}')">🗑️ Trinti</button>
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

// Pridėti/atnaujinti produktą
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value),
        unit: document.getElementById('unit').value
    };

    try {
        if (editingProductId) {
            // Atnaujinti esamą produktą
            await API.products.update(editingProductId, productData);
            alert('Produktas atnaujintas sėkmingai!');
        } else {
            // Pridėti naują produktą
            await API.products.create(productData);
            alert('Produktas pridėtas sėkmingai!');
        }

        document.getElementById('product-form').reset();
        editingProductId = null;
        document.getElementById('cancel-edit').style.display = 'none';
        loadProducts();
    } catch (error) {
        console.error('Klaida išsaugant produktą:', error);
        alert('Nepavyko išsaugoti produkto: ' + error.message);
    }
});

// Redaguoti produktą
async function editProduct(id) {
    try {
        const product = await API.products.getById(id);

        document.getElementById('name').value = product.name;
        document.getElementById('description').value = product.description || '';
        document.getElementById('price').value = product.price;
        document.getElementById('unit').value = product.unit;

        editingProductId = id;
        document.getElementById('cancel-edit').style.display = 'inline-block';
        
        // Scroll į formą
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Klaida kraunant produktą:', error);
        alert('Nepavyko užkrauti produkto: ' + error.message);
    }
}

// Atšaukti redagavimą
document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('product-form').reset();
    editingProductId = null;
    document.getElementById('cancel-edit').style.display = 'none';
});

// Ištrinti produktą
async function deleteProduct(id, name) {
    if (!confirm(`Ar tikrai norite ištrinti produktą "${name}"?`)) {
        return;
    }

    try {
        await API.products.delete(id);
        alert('Produktas ištrintas sėkmingai!');
        loadProducts();
    } catch (error) {
        console.error('Klaida trinant produktą:', error);
        alert('Nepavyko ištrinti produkto: ' + error.message);
    }
}

// Krauname produktus kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', loadProducts);