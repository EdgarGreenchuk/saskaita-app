// Dark Mode funkcionalumas

// Patikrinti ar dark mode buvo išsaugotas
const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';

// Taikyti dark mode jei buvo įjungtas
if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
    updateToggleButton(true);
}

// Toggle funkcija
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    // Išsaugoti pasirinkimą
    if (isDarkMode) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
    
    updateToggleButton(isDarkMode);
}

// Atnaujinti mygtuko emoji
function updateToggleButton(isDarkMode) {
    const button = document.getElementById('dark-mode-toggle');
    if (button) {
        button.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// Event listener mygtukui
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleDarkMode);
    }
});