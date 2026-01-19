// const API_URL moved to config.js

// Funkcija gauti statistiką
async function loadStats() {
    try {
        // Gauti produktų skaičių
        const productsRes = await fetch(`${API_URL}/products`);
        const products = await productsRes.json();
        document.getElementById('products-count').textContent = products.length;

        // Gauti klientų skaičių
        const clientsRes = await fetch(`${API_URL}/clients`);
        const clients = await clientsRes.json();
        document.getElementById('clients-count').textContent = clients.length;

        // Gauti sąskaitų skaičių
        const invoicesRes = await fetch(`${API_URL}/invoices`);
        const invoices = await invoicesRes.json();
        document.getElementById('invoices-count').textContent = invoices.length;
    } catch (error) {
        console.error('Klaida kraunant statistiką:', error);
    }
}

// Paleidžiame kai puslapis užsikrauna
document.addEventListener('DOMContentLoaded', loadStats);