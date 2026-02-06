// ===================================
// REGISTER PAGE LOGIC
// ===================================

// ===================================
// 1. DOM ELEMENTS
// ===================================

const registerForm = document.getElementById('register-form');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const togglePasswordBtn = document.getElementById('toggle-password');
const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
const registerBtn = document.getElementById('register-btn');
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
        registerBtn.disabled = true;
        registerBtn.classList.add('loading');
        fullNameInput.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
        confirmPasswordInput.disabled = true;
        termsCheckbox.disabled = true;
        
        // Show loader
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoader = registerBtn.querySelector('.btn-loader');
        btnText.style.opacity = '0';
        btnLoader.classList.remove('hidden');
        
    } else {
        // Enable form
        registerBtn.disabled = false;
        registerBtn.classList.remove('loading');
        fullNameInput.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
        confirmPasswordInput.disabled = false;
        termsCheckbox.disabled = false;
        
        // Hide loader
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoader = registerBtn.querySelector('.btn-loader');
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate full name (at least first and last name)
 */
function validateFullName(name) {
    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    return nameParts.length >= 2;
}

/**
 * Validate form inputs
 */
function validateForm(fullName, email, password, confirmPassword) {
    // Check empty fields
    if (!fullName || !email || !password || !confirmPassword) {
        showError('Prašome užpildyti visus laukus');
        return false;
    }
    
    // Check full name
    if (!validateFullName(fullName)) {
        showError('Įveskite vardą ir pavardę');
        return false;
    }
    
    // Check email format
    if (!validateEmail(email)) {
        showError('Neteisingas el. pašto formatas');
        return false;
    }
    
    // Check password length
    if (password.length < 6) {
        showError('Slaptažodis per trumpas (min. 6 simboliai)');
        return false;
    }
    
    // Check password match
    if (password !== confirmPassword) {
        showError('Slaptažodžiai nesutampa');
        return false;
    }
    
    // Check terms
    if (!termsCheckbox.checked) {
        showError('Prašome sutikti su sąlygomis');
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
function togglePasswordVisibility(input, button) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    // Update icon
    const eyeIcon = button.querySelector('.eye-icon');
    eyeIcon.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
}

// ===================================
// 5. MAIN REGISTER LOGIC
// ===================================

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();
    
    // Hide previous messages
    hideError();
    hideSuccess();
    
    // Get form values
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate inputs
    if (!validateForm(fullName, email, password, confirmPassword)) {
        return;
    }
    
    // Show loading state
    setLoading(true);
    
    try {
        // Call AuthService register
        const result = await AuthService.register(email, password, fullName);
        
        if (result.success) {
            // Success!
            console.log('✅ Registration successful:', result.user);
            
            // Show success message
            showSuccess('Registracija sėkminga! Nukreipiame į dashboard...');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1000);
            
        } else {
            // Registration failed
            console.error('❌ Registration failed:', result.error);
            
            // Show user-friendly error
            let errorMsg = result.error || 'Registracija nepavyko';
            
            // Customize error messages
            if (errorMsg.includes('duplicate') || errorMsg.includes('exists')) {
                errorMsg = 'Šis el. paštas jau užregistruotas';
            }
            
            showError(errorMsg);
            
            // Re-enable form
            setLoading(false);
        }
        
    } catch (error) {
        // Unexpected error
        console.error('❌ Unexpected error:', error);
        showError('Įvyko klaida. Bandykite dar kartą.');
        setLoading(false);
    }
}

// ===================================
// 6. EVENT LISTENERS
// ===================================

// Form submission
registerForm.addEventListener('submit', handleRegister);

// Password toggles
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(passwordInput, togglePasswordBtn);
    });
}

if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
    });
}

// Clear error on input
fullNameInput.addEventListener('input', hideError);
emailInput.addEventListener('input', hideError);
passwordInput.addEventListener('input', hideError);
confirmPasswordInput.addEventListener('input', hideError);

// Real-time password match validation
confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.style.borderColor = '#ef4444';
    } else {
        confirmPasswordInput.style.borderColor = '';
    }
});

// Enter key navigation
fullNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        emailInput.focus();
    }
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        confirmPasswordInput.focus();
    }
});

// ===================================
// 7. INITIALIZATION
// ===================================

/**
 * Initialize register page
 */
function initRegisterPage() {
    console.log('📝 Register page loaded');
    
    // Check if already authenticated
    AuthService.redirectIfAuthenticated();
    
    // Focus full name input
    fullNameInput.focus();
    
    console.log('✅ Register page ready');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegisterPage);
} else {
    initRegisterPage();
}

console.log('✅ register.js loaded');