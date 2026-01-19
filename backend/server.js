const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./database/db');
const productsRouter = require('./routes/products');
const clientsRouter = require('./routes/clients');
const invoicesRouter = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3000;

// ⭐ CORS Configuration - PATAISYTA!
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://poetic-gecko-739299.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.use(express.json());

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/invoices', invoicesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection error:', err);
    } else {
      console.log('✅ Prisijungta prie PostgreSQL duombazės!');
    }
  });
});