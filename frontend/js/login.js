// ===================================
// LOGIN PAGE LOGIC
// ===================================

// ===================================
// 1. DOM ELEMENTS
// ===================================

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember-me');
const togglePasswordBtn = document.getElementById('toggle-password');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// ===================================
// 2. UI HELPER FUNCTIONS
// ===================================

/**
 * Show error message to user
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Show success message to user
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Hide success message
 */
function hideSuccess() {
    successMessage.classList.add('hidden');
}

/**
 * Set loading state on form
 */
function setLoading(isLoading) {
    if (isLoading) {
        // Disable form
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        emailInput.disabled = true;
        passwordInput.disabled = true;
        
        // Show loader
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        btnText.style.opacity = '0';
        btnLoader.classList.remove('hidden');
        
    } else {
        // Enable form
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        emailInput.disabled = false;
        passwordInput.disabled = false;
        
        // Hide loader
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        btnText.style.opacity = '1';
        btnLoader.classList.add('hidden');
    }
}

// ===================================
// 3. VALIDATION FUNCTIONS
// ===================================

/**
 * Validate email format
 */
function validateEmail(email) {
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate form inputs
 */
function validateForm(email, password) {
    // Check empty fields
    if (!email || !password) {
        showError('Prašome užpildyti visus laukus');
        return false;
    }
    
    // Check email format
    if (!validateEmail(email)) {
        showError('Neteisingas el. pašto formatas');
        return false;
    }
    
    // Check password length (optional - backend will validate anyway)
    if (password.length < 6) {
        showError('Slaptažodis per trumpas (min. 6 simboliai)');
        return false;
    }
    
    return true;
}

// ===================================
// 4. PASSWORD TOGGLE FUNCTIONALITY
// ===================================

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    // Update icon
    const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
    eyeIcon.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
}

// ===================================
// 5. REMEMBER ME FUNCTIONALITY
// ===================================

/**
 * Load saved email from localStorage
 */
function loadSavedEmail() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
}

/**
 * Save or remove email based on checkbox
 */
function handleRememberMe(email) {
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }
}

// ===================================
// 6. MAIN LOGIN LOGIC
// ===================================

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // Hide previous messages
    hideError();
    hideSuccess();
    
    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!validateForm(email, password)) {
        return;
    }
    
    // Show loading state
    setLoading(true);
    
    try {
        // Call AuthService login
        const result = await AuthService.login(email, password);
        
        if (result.success) {
            // Success!
            console.log('✅ Login successful:', result.user);
            
            // Handle remember me
            handleRememberMe(email);
            
            // Show success message briefly
            showSuccess('Prisijungimas sėkmingas! Nukreipiame...');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
            
        } else {
            // Login failed
            console.error('❌ Login failed:', result.error);
            
            // Show user-friendly error
            showError(result.error || 'Prisijungti nepavyko. Patikrinkite duomenis.');
            
            // Re-enable form
            setLoading(false);
            
            // Focus back to password for retry
            passwordInput.select();
        }
        
    } catch (error) {
        // Unexpected error
        console.error('❌ Unexpected error:', error);
        showError('Įvyko klaida. Bandykite dar kartą.');
        setLoading(false);
    }
}

// ===================================
// 7. EVENT LISTENERS
// ===================================

// Form submission
loginForm.addEventListener('submit', handleLogin);

// Password toggle
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
}

// Clear error on input
emailInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);

// Enter key on email - focus password
emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordInput.focus();
    }
});

// ===================================
// 8. INITIALIZATION
// ===================================

/**
 * Initialize login page
 */
function initLoginPage() {
    console.log('🔐 Login page loaded');
    
    // Check if already authenticated
    AuthService.redirectIfAuthenticated();
    
    // Load saved email if exists
    loadSavedEmail();
    
    // Focus email input
    emailInput.focus();
    
    console.log('✅ Login page ready');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}

// ===================================
// 9. KEYBOARD SHORTCUTS (Optional)
// ===================================

// Ctrl/Cmd + Enter to submit from anywhere in form
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === emailInput || 
            document.activeElement === passwordInput) {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

console.log('✅ login.js loaded');