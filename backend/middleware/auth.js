const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Gauti token iš Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Prieiga uždrausta. Reikalingas prisijungimas.' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Netinkamas arba pasibaigęs token.' 
            });
        }
        
        // Pridėti user info prie request
        req.user = user;
        next();
    });
};

// Optional: Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Priėjimas tik administratoriams.' 
        });
    }
    next();
};

module.exports = { authenticateToken, isAdmin };