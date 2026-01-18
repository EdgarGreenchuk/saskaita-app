const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// GET - gauti visus produktus
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant produktus' });
  }
});

// GET - gauti vieną produktą
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant produktą' });
  }
});

// POST - pridėti naują produktą
router.post('/', async (req, res) => {
  try {
    const { name, description, price, unit } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, unit) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, unit || 'vnt']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida pridedant produktą' });
  }
});

// PUT - atnaujinti produktą
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, unit } = req.body;
    
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, unit = $4 WHERE id = $5 RETURNING *',
      [name, description, price, unit, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida atnaujinant produktą' });
  }
});

// DELETE - ištrinti produktą
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produktas nerastas' });
    }
    
    res.json({ message: 'Produktas ištrintas', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida trinant produktą' });
  }
});

module.exports = router;