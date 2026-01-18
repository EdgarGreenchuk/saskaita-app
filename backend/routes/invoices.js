const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// GET - gauti visas sąskaitas su klientų informacija
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        invoices.*,
        clients.company_name as client_name
      FROM invoices
      LEFT JOIN clients ON invoices.client_id = clients.id
      ORDER BY invoices.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant sąskaitas' });
  }
});

// GET - gauti vieną sąskaitą su visais duomenimis (klientas + items)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Gauti sąskaitos duomenis su klientu
    const invoiceResult = await pool.query(`
      SELECT 
        invoices.*,
        clients.*,
        clients.id as client_id,
        invoices.id as invoice_id
      FROM invoices
      LEFT JOIN clients ON invoices.client_id = clients.id
      WHERE invoices.id = $1
    `, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sąskaita nerasta' });
    }

    // Gauti sąskaitos eilutes su produktų pavadinimais
    const itemsResult = await pool.query(`
  SELECT 
    invoice_items.*,
    products.name as product_name
  FROM invoice_items
  LEFT JOIN products ON invoice_items.product_id = products.id
  WHERE invoice_items.invoice_id = $1
`, [id]);

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida gaunant sąskaitą' });
  }
});

// POST - sukurti naują sąskaitą
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      invoice_number,
      client_id,
      invoice_date,
      due_date,
      shipping_price,
      items
    } = req.body;

    await client.query('BEGIN');

    // Apskaičiuoti sumas
    let subtotal = parseFloat(shipping_price) || 0;

    items.forEach(item => {
      let itemTotal = item.quantity * item.price;

      // Atimti nuolaidą
      if (item.discount_type === 'fixed') {
        itemTotal -= parseFloat(item.discount_value);
      } else if (item.discount_type === 'percent') {
        itemTotal -= (itemTotal * parseFloat(item.discount_value) / 100);
      }

      subtotal += itemTotal;
    });

    const vat_amount = subtotal * 0.21;
    const total = subtotal + vat_amount;

    // Įterpti sąskaitą
    const invoiceResult = await client.query(`
      INSERT INTO invoices (
        invoice_number, client_id, invoice_date, due_date, 
        shipping_price, subtotal, vat_amount, total, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unpaid') 
      RETURNING *
    `, [
      invoice_number,
      client_id,
      invoice_date,
      due_date,
      shipping_price,
      subtotal.toFixed(2),
      vat_amount.toFixed(2),
      total.toFixed(2)
    ]);

    const invoiceId = invoiceResult.rows[0].id;

    // Įterpti sąskaitos eilutes
    for (const item of items) {
      let line_total = item.quantity * item.price;

      if (item.discount_type === 'fixed') {
        line_total -= parseFloat(item.discount_value);
      } else if (item.discount_type === 'percent') {
        line_total -= (line_total * parseFloat(item.discount_value) / 100);
      }

      await client.query(`
  INSERT INTO invoice_items (
    invoice_id, product_id, description, quantity, price, 
    discount_type, discount_value, line_total
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`, [
        invoiceId,
        item.product_id,
        item.description,
        item.quantity,
        item.price,
        item.discount_type || null,
        item.discount_value || 0,
        line_total.toFixed(2)
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json(invoiceResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Klaida kuriant sąskaitą' });
  } finally {
    client.release();
  }
});

// DELETE - ištrinti sąskaitą
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sąskaita nerasta' });
    }

    res.json({ message: 'Sąskaita ištrinta', invoice: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Klaida trinant sąskaitą' });
  }
});
// PUT - atnaujinti sąskaitą
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      invoice_number,
      client_id,
      invoice_date,
      due_date,
      shipping_price,
      items,
      status
    } = req.body;

    await client.query('BEGIN');

    // Apskaičiuoti sumas
    let subtotal = parseFloat(shipping_price) || 0;

    items.forEach(item => {
      let itemTotal = item.quantity * item.price;

      if (item.discount_type === 'fixed') {
        itemTotal -= parseFloat(item.discount_value);
      } else if (item.discount_type === 'percent') {
        itemTotal -= (itemTotal * parseFloat(item.discount_value) / 100);
      }

      subtotal += itemTotal;
    });

    const vat_amount = subtotal * 0.21;
    const total = subtotal + vat_amount;

    // Atnaujinti sąskaitą
    const invoiceResult = await client.query(`
      UPDATE invoices 
      SET invoice_number = $1, 
          client_id = $2, 
          invoice_date = $3, 
          due_date = $4, 
          shipping_price = $5, 
          subtotal = $6, 
          vat_amount = $7, 
          total = $8,
          status = $9
      WHERE id = $10
      RETURNING *
    `, [
      invoice_number,
      client_id,
      invoice_date,
      due_date,
      shipping_price,
      subtotal.toFixed(2),
      vat_amount.toFixed(2),
      total.toFixed(2),
      status || 'unpaid',
      id
    ]);

    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sąskaita nerasta' });
    }

    // Ištrinti senas invoice_items
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    // Įterpti naujas eilutes
    for (const item of items) {
      let line_total = item.quantity * item.price;

      if (item.discount_type === 'fixed') {
        line_total -= parseFloat(item.discount_value);
      } else if (item.discount_type === 'percent') {
        line_total -= (line_total * parseFloat(item.discount_value) / 100);
      }

      await client.query(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, price, 
          discount_type, discount_value, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        id,
        item.product_id,
        item.description,
        item.quantity,
        item.price,
        item.discount_type || null,
        item.discount_value || 0,
        line_total.toFixed(2)
      ]);
    }

    await client.query('COMMIT');

    res.json(invoiceResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Klaida atnaujinant sąskaitą' });
  } finally {
    client.release();
  }
});

module.exports = router;