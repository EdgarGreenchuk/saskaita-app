// Formatuoti IBAN su tarpais
function formatIBAN(input) {
    let value = input.value.replace(/\s/g, '').toUpperCase();
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formatted;
}

// Krauname profilį iš DB
async function loadProfile() {
    try {
        const profile = await API.seller.get();

        if (profile) {
            document.getElementById('company_name').value = profile.company_name || '';
            document.getElementById('company_code').value = profile.company_code || '';
            document.getElementById('vat_code').value = profile.vat_code || '';
            document.getElementById('address').value = profile.address || '';
            document.getElementById('city').value = profile.city || '';
            document.getElementById('postal_code').value = profile.postal_code || '';
            document.getElementById('country').value = profile.country || 'Lietuva';
            document.getElementById('email').value = profile.email || '';
            document.getElementById('phone').value = profile.phone || '';
            document.getElementById('iban').value = profile.iban || '';

            // Tema
            const theme = profile.theme || 'amber';
            const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
            if (radio) radio.checked = true;
            applyTheme(theme);

            updatePreview(profile);
        }
    } catch (error) {
        console.error('Klaida kraunant profilį:', error);
    }
}

// Realaus laiko preview
function updatePreview(data) {
    const preview = document.getElementById('invoice-preview');
    const container = document.getElementById('preview-container');

    if (!data.company_name) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    preview.innerHTML = `
        <p><strong>${data.company_name}</strong></p>
        ${data.company_code ? `<p>Įmonės kodas: ${data.company_code}</p>` : ''}
        ${data.vat_code ? `<p>PVM kodas: ${data.vat_code}</p>` : ''}
        ${data.address ? `<p>${data.address}${data.city ? ', ' + data.city : ''}${data.postal_code ? ' ' + data.postal_code : ''}</p>` : ''}
        ${data.country ? `<p>${data.country}</p>` : ''}
        ${data.email ? `<p>El. paštas: ${data.email}</p>` : ''}
        ${data.phone ? `<p>Tel: ${data.phone}</p>` : ''}
        ${data.iban ? `<p>IBAN: ${data.iban}</p>` : ''}
    `;
}

// Tema keičiasi iš karto
document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
        applyTheme(radio.value);
    });
});

// Išsaugoti
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = '⏳ Saugoma...';
    saveBtn.disabled = true;

    const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || 'amber';

    const profileData = {
        company_name: document.getElementById('company_name').value,
        company_code: document.getElementById('company_code').value,
        vat_code: document.getElementById('vat_code').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        postal_code: document.getElementById('postal_code').value,
        country: document.getElementById('country').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        iban: document.getElementById('iban').value.replace(/\s/g, ''),
        theme: selectedTheme
    };

    try {
        await API.seller.save(profileData);
        applyTheme(selectedTheme);
        alert('✅ Profilis išsaugotas!');
        updatePreview(profileData);
    } catch (error) {
        console.error('Klaida:', error);
        alert('❌ Nepavyko išsaugoti: ' + error.message);
    } finally {
        saveBtn.textContent = '💾 Išsaugoti profilį';
        saveBtn.disabled = false;
    }
});

// Realaus laiko preview kai rašo
document.querySelectorAll('input:not([name="theme"])').forEach(input => {
    input.addEventListener('input', () => {
        updatePreview({
            company_name: document.getElementById('company_name').value,
            company_code: document.getElementById('company_code').value,
            vat_code: document.getElementById('vat_code').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postal_code: document.getElementById('postal_code').value,
            country: document.getElementById('country').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            iban: document.getElementById('iban').value
        });
    });
});

document.addEventListener('DOMContentLoaded', loadProfile);