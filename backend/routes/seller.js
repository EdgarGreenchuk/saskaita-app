const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET - gauti savo profilį
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM seller_profiles WHERE user_id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Klaida kraunant profilį:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// PUT - sukurti arba atnaujinti (UPSERT)
router.put('/', async (req, res) => {
    const {
        company_name, company_code, vat_code,
        address, city, postal_code, country,
        email, phone, iban, theme
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO seller_profiles 
             (user_id, company_name, company_code, vat_code, address, city, postal_code, country, email, phone, iban, theme)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (user_id) DO UPDATE SET
                company_name=$2, company_code=$3, vat_code=$4, address=$5, city=$6,
                postal_code=$7, country=$8, email=$9, phone=$10, iban=$11, theme=$12,
                updated_at=NOW()
             RETURNING *`,
            [req.user.userId, company_name, company_code, vat_code,
             address, city, postal_code, country,
             email, phone, iban, theme || 'amber']
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Klaida išsaugant profilį:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

module.exports = router;