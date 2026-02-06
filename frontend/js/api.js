// ===================================
// API SERVICE
// Centralized HTTP client with auth
// Follows Single Responsibility Principle
// ===================================

class ApiService {
    constructor() {
        this.baseUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api';
    }

    /**
     * Get authentication headers
     * Automatically includes Authorization token if user is logged in
     */
    getHeaders(includeContentType = true) {
        const headers = {};
        
        // Add Authorization if logged in
        const token = AuthService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add Content-Type for JSON requests
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    }

    /**
     * Handle API response
     * Centralized error handling and auth checking
     */
    async handleResponse(response) {
        // If unauthorized, clear auth and redirect to login
        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Unauthorized - clearing auth');
            AuthService.clearAuth();
            window.location.href = '/login.html';
            throw new Error('Unauthorized');
        }

        // Parse JSON response
        const data = await response.json();

        // If response not ok, throw error with server message
        if (!response.ok) {
            throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }

        return data;
    }

    /**
     * Generic request method
     * All HTTP methods use this internally
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.body !== undefined),
                ...options.headers
            }
        };

        try {
            console.log(`🔄 API [${options.method || 'GET'}] ${endpoint}`);
            const response = await fetch(url, config);
            const data = await this.handleResponse(response);
            console.log(`✅ API [${options.method || 'GET'}] ${endpoint} - Success`);
            return data;
        } catch (error) {
            console.error(`❌ API [${options.method || 'GET'}] ${endpoint}:`, error.message);
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint (e.g., '/clients', '/products')
     * @returns {Promise} Response data
     */
    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send in request body
     * @returns {Promise} Response data
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send in request body
     * @returns {Promise} Response data
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send in request body
     * @returns {Promise} Response data
     */
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // ===================================
    // CONVENIENCE METHODS
    // Domain-specific API calls
    // ===================================

    /**
     * Clients API
     */
    clients = {
        getAll: () => this.get('/clients'),
        getById: (id) => this.get(`/clients/${id}`),
        create: (data) => this.post('/clients', data),
        update: (id, data) => this.put(`/clients/${id}`, data),
        delete: (id) => this.delete(`/clients/${id}`)
    };

    /**
     * Products API
     */
    products = {
        getAll: () => this.get('/products'),
        getById: (id) => this.get(`/products/${id}`),
        create: (data) => this.post('/products', data),
        update: (id, data) => this.put(`/products/${id}`, data),
        delete: (id) => this.delete(`/products/${id}`)
    };

    /**
     * Invoices API
     */
    invoices = {
        getAll: () => this.get('/invoices'),
        getById: (id) => this.get(`/invoices/${id}`),
        create: (data) => this.post('/invoices', data),
        update: (id, data) => this.put(`/invoices/${id}`, data),
        delete: (id) => this.delete(`/invoices/${id}`)
    };
}

// Global instance - available everywhere
const API = new ApiService();

console.log('✅ API service loaded');