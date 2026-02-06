const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// ⭐ REQUIRE AUTH FOR ALL ROUTES
router.use(authenticateToken);

// GET - gauti visus produktus (TIK USERIO)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY id DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant produktus' });
  }
});

// GET - gauti vieną produktą (TIKRINTI OWNERSHIP)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant produktą' });
  }
});

// POST - pridėti naują produktą (SU user_id)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, unit } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, unit, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, unit || 'vnt', req.user.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida pridedant produktą' });
  }
});

// PUT - atnaujinti produktą (TIKRINTI OWNERSHIP)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, unit } = req.body;
    
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, unit = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, description, price, unit, id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas arba neturite teisių' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida atnaujinant produktą' });
  }
});

// DELETE - ištrinti produktą (TIKRINTI OWNERSHIP)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas arba neturite teisių' });
    }
    
    res.json({ message: 'Produktas ištrintas', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida trinant produktą' });
  }
});

module.exports = router;