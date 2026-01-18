const API_URL = '/api';  // Relative path

let salesChart = null;
let statusChart = null;

// ========================================
// LOAD DATA
// ========================================

async function loadDashboard() {
    try {
        // Gauti visus duomenis
        const [invoices, clients, products] = await Promise.all([
            fetch(`${API_URL}/invoices`).then(r => r.json()),
            fetch(`${API_URL}/clients`).then(r => r.json()),
            fetch(`${API_URL}/products`).then(r => r.json())
        ]);

        // Apskaičiuoti KPI
        calculateKPIs(invoices, clients);

        // Piešti grafikus
        drawSalesChart(invoices);
        drawStatusChart(invoices);

        // Top lists
        displayTopClients(invoices, clients);
        displayTopProducts(invoices, products);

        // Recent activity
        displayRecentActivity(invoices, clients);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Klaida kraunant dashboard duomenis');
    }
}

// ========================================
// KPI CALCULATIONS
// ========================================

function calculateKPIs(invoices, clients) {
    // Total revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + ' €';

    // Unpaid revenue
    const unpaidRevenue = invoices
        .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total), 0);
    document.getElementById('unpaid-revenue').textContent = unpaidRevenue.toFixed(2) + ' €';

    // Total invoices
    document.getElementById('total-invoices').textContent = invoices.length;

    // Active clients (clients with invoices)
    const activeClientIds = new Set(invoices.map(inv => inv.client_id));
    document.getElementById('total-clients').textContent = activeClientIds.size;
}

// ========================================
// SALES CHART (LINE)
// ========================================

function drawSalesChart(invoices) {
    const ctx = document.getElementById('salesChart');

    // Group by month
    const salesByMonth = {};
    invoices.forEach(inv => {
        const date = new Date(inv.invoice_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!salesByMonth[monthKey]) {
            salesByMonth[monthKey] = 0;
        }
        salesByMonth[monthKey] += parseFloat(inv.total);
    });

    // Sort by date
    const sortedMonths = Object.keys(salesByMonth).sort();
    const labels = sortedMonths.map(key => {
        const [year, month] = key.split('-');
        return `${year}-${month}`;
    });
    const data = sortedMonths.map(key => salesByMonth[key].toFixed(2));

    // Destroy old chart if exists
    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pardavimai (EUR)',
                data: data,
                borderColor: '#C9941A',
                backgroundColor: 'rgba(201, 148, 26, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#2C1810',
                         font: {
                        size: 12  
                    }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#2C1810',
                        callback: function(value) {
                            return value + ' €';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#2C1810'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
}

// ========================================
// STATUS CHART (DOUGHNUT)
// ========================================

function drawStatusChart(invoices) {
    const ctx = document.getElementById('statusChart');

    // Count by status
    const statusCounts = {
        'paid': 0,
        'unpaid': 0,
        'overdue': 0
    };

    invoices.forEach(inv => {
        const status = inv.status || 'unpaid';
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        }
    });

    // Destroy old chart if exists
    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Apmokėtos', 'Neapmokėtos', 'Uždeltos'],
            datasets: [{
                data: [statusCounts.paid, statusCounts.unpaid, statusCounts.overdue],
                backgroundColor: [
                    '#38ef7d',
                    '#C9941A',
                    '#8B4513'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio:1.3,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#2C1810',
                        padding: 15,
                        font: {
                        size: 13
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// TOP CLIENTS
// ========================================

function displayTopClients(invoices, clients) {
    // Group by client
    const clientTotals = {};
    const clientCounts = {};

    invoices.forEach(inv => {
        const clientId = inv.client_id;
        if (!clientTotals[clientId]) {
            clientTotals[clientId] = 0;
            clientCounts[clientId] = 0;
        }
        clientTotals[clientId] += parseFloat(inv.total);
        clientCounts[clientId]++;
    });

    // Sort and get top 5
    const topClients = Object.entries(clientTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Display
    const container = document.getElementById('top-clients');
    
    if (topClients.length === 0) {
        container.innerHTML = '<p>Nėra duomenų</p>';
        return;
    }

    let html = '';
    topClients.forEach(([clientId, total]) => {
        const client = clients.find(c => c.id == clientId);
        const clientName = client ? client.company_name : 'Nežinomas klientas';
        const count = clientCounts[clientId];

        html += `
            <div class="top-item">
                <span class="top-item-name">${clientName}</span>
                <span class="top-item-value">${total.toFixed(2)} €</span>
                <span class="top-item-count">(${count} sąsk.)</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ========================================
// TOP PRODUCTS
// ========================================

function displayTopProducts(invoices, products) {
    // Get all invoice items
    const productCounts = {};
    const productRevenue = {};

    invoices.forEach(inv => {
        if (inv.items && inv.items.length > 0) {
            inv.items.forEach(item => {
                const productId = item.product_id;
                if (!productId) return; // Skip manual items

                if (!productCounts[productId]) {
                    productCounts[productId] = 0;
                    productRevenue[productId] = 0;
                }
                productCounts[productId] += parseInt(item.quantity);
                productRevenue[productId] += parseFloat(item.line_total);
            });
        }
    });

    // Sort by revenue and get top 5
    const topProducts = Object.entries(productRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Display
    const container = document.getElementById('top-products');
    
    if (topProducts.length === 0) {
        container.innerHTML = '<p>Nėra duomenų</p>';
        return;
    }

    let html = '';
    topProducts.forEach(([productId, revenue]) => {
        const product = products.find(p => p.id == productId);
        const productName = product ? product.name : 'Nežinomas produktas';
        const count = productCounts[productId];

        html += `
            <div class="top-item">
                <span class="top-item-name">${productName}</span>
                <span class="top-item-value">${revenue.toFixed(2)} €</span>
                <span class="top-item-count">(${count} vnt.)</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ========================================
// RECENT ACTIVITY
// ========================================

function displayRecentActivity(invoices, clients) {
    // Sort by date (newest first) and get last 10
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.created_at || b.invoice_date) - new Date(a.created_at || a.invoice_date))
        .slice(0, 10);

    const container = document.getElementById('recent-activity');
    
    if (recentInvoices.length === 0) {
        container.innerHTML = '<p>Nėra veiklos</p>';
        return;
    }

    let html = '';
    recentInvoices.forEach(inv => {
        const client = clients.find(c => c.id == inv.client_id);
        const clientName = client ? client.company_name : 'Nežinomas klientas';
        
        const icon = inv.status === 'paid' ? '✅' : 
                    inv.status === 'overdue' ? '⚠️' : '📋';

        const statusText = inv.status === 'paid' ? 'Apmokėta' : 
                          inv.status === 'overdue' ? 'Uždelsta' : 'Neapmokėta';

        const date = new Date(inv.created_at || inv.invoice_date);
        const dateStr = date.toLocaleDateString('lt-LT');

        html += `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-title">Sąskaita ${inv.invoice_number}</div>
                    <div class="activity-details">${clientName} • ${inv.total} € • ${statusText}</div>
                </div>
                <div class="activity-date">${dateStr}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ========================================
// DARK MODE CHART COLORS
// ========================================

function updateChartsForDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#eee' : '#2C1810';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    if (salesChart) {
        salesChart.options.plugins.legend.labels.color = textColor;
        salesChart.options.scales.y.ticks.color = textColor;
        salesChart.options.scales.x.ticks.color = textColor;
        salesChart.options.scales.y.grid.color = gridColor;
        salesChart.options.scales.x.grid.color = gridColor;
        salesChart.update();
    }

    if (statusChart) {
        statusChart.options.plugins.legend.labels.color = textColor;
        statusChart.update();
    }
}

// Listen for dark mode changes
const darkModeObserver = new MutationObserver(() => {
    updateChartsForDarkMode();
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    // Watch for dark mode changes
    darkModeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
});