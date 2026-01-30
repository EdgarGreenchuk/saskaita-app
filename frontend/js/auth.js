// ===================================
// AUTHENTICATION SERVICE
// localStorage based authentication
// ===================================

const AuthService = {
    // Get API URL from config (already includes /api path)
    get apiUrl() {
        return typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api';
    },

    // ==========================================
    // TOKEN MANAGEMENT
    // ==========================================
    
    /**
     * Save token to localStorage with expiry
     */
    saveToken(token, expiresIn = 86400000) { // Default 24h in ms
        localStorage.setItem('token', token);
        const expiresAt = Date.now() + expiresIn;
        localStorage.setItem('tokenExpiry', expiresAt.toString());
        console.log('✅ Token saved. Expires at:', new Date(expiresAt).toLocaleString());
    },

    /**
     * Get token from localStorage (checks expiry)
     */
    getToken() {
        const token = localStorage.getItem('token');
        const expiry = localStorage.getItem('tokenExpiry');
        
        // No token or expiry
        if (!token || !expiry) {
            return null;
        }
        
        // Check if expired
        if (Date.now() > parseInt(expiry)) {
            console.warn('⚠️ Token expired');
            this.clearAuth();
            return null;
        }
        
        return token;
    },

    /**
     * Clear all auth data from localStorage
     */
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
        console.log('🗑️ Auth data cleared');
    },

    // ==========================================
    // USER MANAGEMENT
    // ==========================================
    
    /**
     * Save user info to localStorage
     */
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User saved:', user.email);
    },

    /**
     * Get user info from localStorage
     */
    getUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            return null;
        }
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.getToken() !== null;
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // ==========================================
    // AUTHENTICATION ACTIONS
    // ==========================================
    
    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token and user
            this.saveToken(data.token);
            this.saveUser(data.user);

            console.log('✅ Login successful:', data.user.email);
            return { success: true, user: data.user };

        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Register new user
     */
    async register(email, password, fullName) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, fullName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Save token and user
            this.saveToken(data.token);
            this.saveUser(data.user);

            console.log('✅ Registration successful:', data.user.email);
            return { success: true, user: data.user };

        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Verify token with backend
     */
    async verifyToken() {
        const token = this.getToken();
        if (!token) {
            console.warn('⚠️ No token to verify');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn('⚠️ Token verification failed');
                this.clearAuth();
                return false;
            }

            const data = await response.json();
            console.log('✅ Token verified:', data.user.email);
            
            // Update user data if changed
            this.saveUser(data.user);
            
            return true;

        } catch (error) {
            console.error('❌ Verify error:', error);
            this.clearAuth();
            return false;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        const token = this.getToken();
        
        // Try to logout on backend (optional - token will expire anyway)
        if (token) {
            try {
                await fetch(`${this.apiUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.warn('⚠️ Backend logout failed (will clear local data anyway)');
            }
        }

        // Clear local data
        this.clearAuth();
        console.log('✅ Logout successful');
        
        // Redirect to login
        window.location.href = 'login.html';
    },

    // ==========================================
    // PAGE PROTECTION
    // ==========================================
    
    /**
     * Protect page - redirect to login if not authenticated
     * Call this at the start of every protected page
     */
    async requireAuth() {
        // Check if logged in
        if (!this.isLoggedIn()) {
            console.warn('⚠️ Not logged in - redirecting to login');
            window.location.href = 'login.html';
            return false;
        }

        // Verify token with backend (optional - can be skipped for better UX)
        const isValid = await this.verifyToken();
        if (!isValid) {
            console.warn('⚠️ Token invalid - redirecting to login');
            window.location.href = 'login.html';
            return false;
        }

        console.log('✅ Authentication verified');
        return true;
    },

    /**
     * Require admin role
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            console.warn('⚠️ Admin access required');
            alert('Administratoriaus teisės būtinos!');
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    },

    /**
     * Redirect to dashboard if already logged in
     * Use on login/register pages
     */
    redirectIfAuthenticated() {
        if (this.isLoggedIn()) {
            console.log('✅ Already logged in - redirecting to dashboard');
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    },

    // ==========================================
    // API HELPERS
    // ==========================================
    
    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No authentication token');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, mergedOptions);
            
            // If unauthorized, clear auth and redirect
            if (response.status === 401 || response.status === 403) {
                console.warn('⚠️ Unauthorized - clearing auth');
                this.clearAuth();
                window.location.href = 'login.html';
                throw new Error('Unauthorized');
            }

            return response;

        } catch (error) {
            console.error('❌ API request error:', error);
            throw error;
        }
    },

    // ==========================================
    // UI HELPERS
    // ==========================================
    
    /**
     * Update UI with user info
     */
    updateUserUI() {
        const user = this.getUser();
        if (!user) return;

        // Update user name displays
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = user.fullName || user.email;
        });

        // Update user email displays
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        // Show/hide admin elements
        if (user.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = '';
            });
        } else {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    },

    /**
     * Add logout button handler
     */
    setupLogoutButton(buttonSelector = '#logout-btn') {
        const logoutBtn = document.querySelector(buttonSelector);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
            console.log('✅ Logout button configured');
        }
    }
};

// ==========================================
// GLOBAL FUNCTIONS (for inline use)
// ==========================================

/**
 * Quick check if user is authenticated
 */
function isAuthenticated() {
    return AuthService.isLoggedIn();
}

/**
 * Quick logout
 */
function logout() {
    AuthService.logout();
}

/**
 * Get current user
 */
function getCurrentUser() {
    return AuthService.getUser();
}

console.log('✅ Auth service loaded');