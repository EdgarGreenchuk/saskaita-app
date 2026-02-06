const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// ⭐ REQUIRE AUTH FOR ALL ROUTES
router.use(authenticateToken);

// GET - gauti visus klientus (TIK USERIO)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY id DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant klientus' });
  }
});

// GET - gauti vieną klientą (TIKRINTI OWNERSHIP)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Klientas nerastas' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant klientą' });
  }
});

// POST - pridėti naują klientą (SU user_id)
router.post('/', async (req, res) => {
  try {
    const { company_name, company_code, vat_code, address, city, postal_code, country, email, phone } = req.body;
    
    const result = await pool.query(
      `INSERT INTO clients (company_name, company_code, vat_code, address, city, postal_code, country, email, phone, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [company_name, company_code, vat_code, address, city, postal_code, country || 'Lietuva', email, phone, req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida pridedant klientą' });
  }
});

// PUT - atnaujinti klientą (TIKRINTI OWNERSHIP)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, company_code, vat_code, address, city, postal_code, country, email, phone } = req.body;
    
    const result = await pool.query(
      `UPDATE clients SET company_name = $1, company_code = $2, vat_code = $3, address = $4, 
       city = $5, postal_code = $6, country = $7, email = $8, phone = $9 
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [company_name, company_code, vat_code, address, city, postal_code, country, email, phone, id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Klientas nerastas arba neturite teisių' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida atnaujinant klientą' });
  }
});

// DELETE - ištrinti klientą (TIKRINTI OWNERSHIP)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Klientas nerastas arba neturite teisių' });
    }
    
    res.json({ message: 'Klientas ištrintas', client: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida trinant klientą' });
  }
});

module.exports = router;