const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// 🔑 REGISTER - Naujo userio registracija
router.post('/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'El. paštas ir slaptažodis yra privalomi' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Slaptažodis turi būti bent 6 simbolių' 
            });
        }

        // Check if user already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Vartotojas su tokiu el. paštu jau egzistuoja' 
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, full_name, role, created_at`,
            [email, passwordHash, fullName || null, 'user']
        );

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: newUser.rows[0].id,
                email: newUser.rows[0].email,
                role: newUser.rows[0].role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'Registracija sėkminga',
            token,
            user: {
                id: newUser.rows[0].id,
                email: newUser.rows[0].email,
                fullName: newUser.rows[0].full_name,
                role: newUser.rows[0].role
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            error: 'Serverio klaida registruojantis' 
        });
    }
});

// 🔑 LOGIN - Prisijungimas
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'El. paštas ir slaptažodis yra privalomi' 
            });
        }

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Neteisingi prisijungimo duomenys' 
            });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(
            password, 
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Neteisingi prisijungimo duomenys' 
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Prisijungimas sėkmingas',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Serverio klaida prisijungiant' 
        });
    }
});

// 🔒 VERIFY TOKEN - Patikrinti ar token galioja
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Vartotojas nerastas' 
            });
        }

        res.json({
            valid: true,
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email,
                fullName: result.rows[0].full_name,
                role: result.rows[0].role
            }
        });

    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ 
            error: 'Serverio klaida' 
        });
    }
});

// 🔓 LOGOUT - Atsijungimas (client-side ištrins token)
router.post('/logout', authenticateToken, (req, res) => {
    // Backend doesn't store tokens (stateless JWT)
    // Client should delete token from localStorage
    res.json({ 
        message: 'Atsijungta sėkmingai' 
    });
});

module.exports = router;