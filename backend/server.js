const express = require('express');
const cors = require('cors');
const path = require('path'); // ← PRIDĖTA
require('dotenv').config(); // ← PRIDĖTA
const pool = require('./database/db');
const productsRouter = require('./routes/products');
const clientsRouter = require('./routes/clients');
const invoicesRouter = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3000; // ← PAKEISTA (naudoja environment variable)

// Middleware
app.use(cors());
app.use(express.json());

// ⭐ SERVE STATIC FRONTEND FILES (PRIDĖTA)
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/products', productsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/invoices', invoicesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ⭐ SERVE INDEX.HTML FOR ROOT (PRIDĖTA)
app.use((req, res, next) => {
  // Išskyrus API routes, serve frontend
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Database connected successfully');
    }
  });
});