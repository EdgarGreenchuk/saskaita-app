const THEMES = {
    amber: {
        name: '🟡 Gintarinė',
        primary: '#C9941A',
        primaryHover: '#E3B04B',
        primaryLight: 'rgba(201, 148, 26, 0.1)'
    },
    blue: {
        name: '🔵 Vandenyno',
        primary: '#1A6FC9',
        primaryHover: '#4A9FE3',
        primaryLight: 'rgba(26, 111, 201, 0.1)'
    },
    green: {
        name: '🟢 Miško',
        primary: '#11998e',
        primaryHover: '#38ef7d',
        primaryLight: 'rgba(17, 153, 142, 0.1)'
    },
    red: {
        name: '🔴 Rubino',
        primary: '#C9281A',
        primaryHover: '#f85032',
        primaryLight: 'rgba(201, 40, 26, 0.1)'
    },
    purple: {
        name: '🟣 Violetinė',
        primary: '#7B1AC9',
        primaryHover: '#c471ed',
        primaryLight: 'rgba(123, 26, 201, 0.1)'
    }
};

function applyTheme(themeName) {
    const theme = THEMES[themeName] || THEMES.amber;
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-hover', theme.primaryHover);
    root.style.setProperty('--primary-light', theme.primaryLight);

    localStorage.setItem('theme', themeName);
}

// Iš karto taikome iš localStorage - be mirkčiojimo
const savedTheme = localStorage.getItem('theme') || 'amber';
applyTheme(savedTheme);

// Po to sinchronizuojame su DB
async function syncThemeFromDB() {
    try {
        const profile = await API.seller.get();
        if (profile && profile.theme) {
            applyTheme(profile.theme);
        }
    } catch (e) {
        // Neautorizuotas puslapis - nieko
    }
}

console.log('🎨 Themes loaded');