# 🔐 Authentication Sistema - Mokymosi Vadovas

**Data:** 2026-01-29  
**Projektas:** Sąskaitų Faktūrų Aplikacija  
**Technologijos:** Node.js, Express, PostgreSQL, JWT, bcrypt

---

## 📑 Turinys

1. [Įvadas](#įvadas)
2. [Teoriniai Pagrindai](#teoriniai-pagrindai)
3. [Database Schema](#database-schema)
4. [Backend Implementacija](#backend-implementacija)
5. [API Endpoints](#api-endpoints)
6. [Security Best Practices](#security-best-practices)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Kitas Žingsnis](#kitas-žingsnis)

---

## 🎯 Įvadas

Šiame vadove aprašoma, kaip sukurti profesionalią **authentication sistemą** naudojant:
- **JWT (JSON Web Tokens)** - token-based authentication
- **bcrypt** - password hashing
- **PostgreSQL** - users duomenų saugojimas
- **Express middleware** - route protection

### Ko išmokome:
✅ Kaip saugiai saugoti slaptažodžius (hashing)  
✅ Kaip veikia JWT tokens  
✅ Kaip apsaugoti API endpoints  
✅ Kaip deploy'inti su environment variables  
✅ Kaip testuoti API su Thunder Client

---

## 🧠 Teoriniai Pagrindai

### 1. Password Hashing (bcrypt)

**Problema:** Slaptažodžiai negali būti saugomi plain text duomenų bazėje!

**Sprendimas:** bcrypt - one-way hashing algoritmas
```javascript
const bcrypt = require('bcrypt');

// Hash slaptažodį
const saltRounds = 10; // kuo didesnis, tuo saugiau (bet lėčiau)
const hash = await bcrypt.hash('myPassword123', saltRounds);
// Rezultatas: $2b$10$... (60 simbolių hash)

// Patikrinti slaptažodį
const isValid = await bcrypt.compare('myPassword123', hash);
// true arba false
```

**Kodėl bcrypt, o ne MD5/SHA256?**
- bcrypt yra **slow by design** - apsaugo nuo brute-force
- Automatiškai prideda **salt** (random data)
- **Adaptive** - galima padidinti rounds ateityje

---

### 2. JWT (JSON Web Tokens)

**Kas yra JWT?**

JWT yra **stateless authentication** metodas. Token sudarytas iš 3 dalių:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  // Header (algoritmas)
.
eyJ1c2VySWQiOjEsImVtYWlsIjoiZWRnYXIi  // Payload (duomenys)
.
71_D-07CsmMtAIVdsf5B7Gw867b_e1fDk3fe  // Signature (parašas)
```

**Kaip veikia:**

1. **User prisijungia** → serveris sukuria JWT
2. **Token grąžinamas** klientui
3. **Klientas saugo** token (localStorage/cookie)
4. **Kiekvienas request** siunčia token `Authorization: Bearer <token>`
5. **Serveris patikrina** signature ir naudoja payload duomenis

**Kodėl JWT?**
- ✅ Stateless - serveris nesaugo session'ų
- ✅ Scalable - veikia su multiple servers
- ✅ Cross-domain - galima naudoti su mobile apps, SPA
- ✅ Self-contained - visos reikalingos info token'e

---

### 3. Authentication vs Authorization

**Authentication** (Autentifikacija):
- "Kas tu esi?"
- Login/Register proceso metu
- Patikrina `email + password`

**Authorization** (Autorizacija):
- "Ką tu gali daryti?"
- Po authentication
- Patikrina `role`, `permissions`

---

## 🗄️ Database Schema

### Users lentelė
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,              -- Auto-incrementing ID
    email VARCHAR(255) UNIQUE NOT NULL, -- Unique email
    password_hash VARCHAR(255) NOT NULL,-- bcrypt hash (60 chars)
    full_name VARCHAR(255),             -- Optional vardas
    role VARCHAR(50) DEFAULT 'user',    -- 'user' arba 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP                -- Track paskutinį prisijungimą
);
```

**Kodėl `password_hash`, o ne `password`?**
- Išvengiame painiavos - aiškiai matome, kad tai hash'as
- Best practice - neleidžia atsitiktinai išsaugoti plain text

**Kodėl email UNIQUE?**
- Vienas email = vienas account
- Database level constraint apsaugo nuo duplikatų

---

## 💻 Backend Implementacija

### Projekto Struktūra
```
backend/
├── middleware/
│   └── auth.js           # JWT verification middleware
├── routes/
│   ├── auth.js           # Login/Register/Verify endpoints
│   ├── clients.js
│   ├── products.js
│   └── invoices.js
├── database/
│   └── db.js
├── server.js
└── package.json
```

---

### 1. Dependencies
```bash
npm install bcrypt jsonwebtoken
```

**bcrypt** - password hashing  
**jsonwebtoken** - JWT creation/verification

---

### 2. Environment Variables

**Railway Variables:**
```env
JWT_SECRET=ilgas_random_64_simboliu_string
JWT_EXPIRES_IN=24h
```

**Kaip generuoti JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**CRITICAL:** JWT_SECRET turi būti:
- ❌ Ne 'secret' ar 'mySecretKey'
- ✅ Ilgas random string (32+ bytes)
- ✅ Skirtingas kiekvienai aplinkai (dev/prod)
- ✅ Niekada necommit'inamas į Git!

---

### 3. Middleware: `middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Gauti token iš Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ 
            error: 'Prieiga uždrausta. Reikalingas prisijungimas.' 
        });
    }

    // 2. Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Netinkamas arba pasibaigęs token.' 
            });
        }
        
        // 3. Pridėti user info prie request objekto
        req.user = user; // { userId, email, role }
        next(); // Leisti toliau
    });
};

// Optional: Admin check
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Priėjimas tik administratoriams.' 
        });
    }
    next();
};

module.exports = { authenticateToken, isAdmin };
```

**Kaip veikia:**
1. Ištraukia token iš `Authorization: Bearer <token>` header
2. Verify token su `JWT_SECRET`
3. Jei valid - prideda `req.user` ir leidžia toliau
4. Jei invalid - grąžina 401/403 error

---

### 4. Routes: `routes/auth.js`

#### REGISTER Endpoint
```javascript
router.post('/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        // 1. VALIDATION
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

        // 2. CHECK IF EXISTS
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Vartotojas su tokiu el. paštu jau egzistuoja' 
            });
        }

        // 3. HASH PASSWORD
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. INSERT USER
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, full_name, role, created_at`,
            [email, passwordHash, fullName || null, 'user']
        );

        // 5. CREATE JWT
        const token = jwt.sign(
            { 
                userId: newUser.rows[0].id,
                email: newUser.rows[0].email,
                role: newUser.rows[0].role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 6. RETURN TOKEN + USER INFO
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
```

**Key Points:**
- ✅ **Validacija** - email, password required
- ✅ **Unikalumas** - tikrina ar email jau egzistuoja
- ✅ **Hash** - bcrypt.hash()
- ✅ **RETURNING** - gauti naują user info iš DB
- ✅ **JWT** - jwt.sign() su user data
- ✅ **201 status** - Created (ne 200!)

---

#### LOGIN Endpoint
```javascript
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. VALIDATION
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'El. paštas ir slaptažodis yra privalomi' 
            });
        }

        // 2. FIND USER
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

        // 3. CHECK PASSWORD
        const validPassword = await bcrypt.compare(
            password, 
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Neteisingi prisijungimo duomenys' 
            });
        }

        // 4. UPDATE LAST LOGIN
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // 5. CREATE JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 6. RETURN TOKEN
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
```

**Security Notes:**
- ❌ **Niekada nerodyti** "User not found" vs "Wrong password"
- ✅ **Visada rodyti** generic "Neteisingi prisijungimo duomenys"
- ❌ **Neleidžia attackeriui** nustatyti kurie email'ai egzistuoja

---

#### VERIFY Endpoint
```javascript
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        // req.user jau pridėtas middleware'o!
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
```

**Naudojimas:**
- Frontend tikrina ar token dar valid
- Auto-redirect jei token expired
- Refresh user info

---

### 5. Protected Routes Pavyzdys
```javascript
// routes/invoices.js
const { authenticateToken } = require('../middleware/auth');

// Visi invoices routes dabar apsaugoti:
router.get('/', authenticateToken, async (req, res) => {
    // req.user.userId - prieiga prie user ID
    // Gali filtruoti invoices pagal userį!
    
    const invoices = await pool.query(
        'SELECT * FROM invoices WHERE user_id = $1',
        [req.user.userId]
    );
    
    res.json(invoices.rows);
});

router.post('/', authenticateToken, async (req, res) => {
    // Sukurti invoice su user_id
    const { clientId, items } = req.body;
    
    const newInvoice = await pool.query(
        'INSERT INTO invoices (user_id, client_id, ...) VALUES ($1, $2, ...)',
        [req.user.userId, clientId, ...]
    );
    
    res.json(newInvoice.rows[0]);
});
```

---

## 🔌 API Endpoints

### Base URL
```
Production: https://saskaita-app-production.up.railway.app
Local: http://localhost:3000
```

---

### 📋 Endpoints Sąrašas

#### 1. REGISTER
```
POST /api/auth/register
```

**Request:**
```json
{
  "email": "edgar@saskaitos.lt",
  "password": "edgar123",
  "fullName": "Edgar"
}
```

**Response (201):**
```json
{
  "message": "Registracija sėkminga",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "edgar@saskaitos.lt",
    "fullName": "Edgar",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Validation error
- `400` - Email jau egzistuoja
- `500` - Server error

---

#### 2. LOGIN
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "edgar@saskaitos.lt",
  "password": "edgar123"
}
```

**Response (200):**
```json
{
  "message": "Prisijungimas sėkmingas",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "edgar@saskaitos.lt",
    "fullName": "Edgar",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Missing email/password
- `401` - Neteisingi prisijungimo duomenys
- `500` - Server error

---

#### 3. VERIFY
```
GET /api/auth/verify
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "edgar@saskaitos.lt",
    "fullName": "Edgar",
    "role": "user"
  }
}
```

**Errors:**
- `401` - Token missing
- `403` - Token invalid/expired
- `404` - User not found
- `500` - Server error

---

#### 4. LOGOUT
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Atsijungta sėkmingai"
}
```

**Note:** JWT yra stateless - logout tik informuoja klientą ištrinti token!

---

## 🔒 Security Best Practices

### 1. Password Requirements
```javascript
// Minimumas:
password.length >= 6

// Geriau:
password.length >= 8 && 
/[A-Z]/.test(password) &&  // Bent viena didžioji
/[a-z]/.test(password) &&  // Bent viena mažoji
/[0-9]/.test(password)     // Bent vienas skaičius

// Idealiai:
password.length >= 12 &&
/[A-Z]/.test(password) &&
/[a-z]/.test(password) &&
/[0-9]/.test(password) &&
/[!@#$%^&*]/.test(password) // Spec. simbolis
```

---

### 2. JWT Token Lifecycle
```javascript
// Token expiration
expiresIn: '24h'  // Normaliai
expiresIn: '15m'  // High-security apps

// Refresh token pattern:
// - Short-lived access token (15min)
// - Long-lived refresh token (7 days)
// - Refresh endpoint keičia access token
```

---

### 3. Rate Limiting
```javascript
// npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Per daug prisijungimo bandymų. Bandykite po 15min.'
});

router.post('/login', loginLimiter, async (req, res) => {
    // ...
});
```

---

### 4. HTTPS Only
```javascript
// Production:
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

---

### 5. CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://saskaitos-fakturos.netlify.app']
        : ['http://localhost:5500'],
    credentials: true
}));
```

---

## 🧪 Testing

### Thunder Client Tests

#### 1. Test Flow:
```
1. REGISTER → Gauti token
2. LOGIN → Gauti token
3. VERIFY → Su token iš #2
4. Protected endpoint → Su token
5. LOGOUT → Ištrinti token client-side
```

---

#### 2. Headers Format:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**CRITICAL:** 
- ✅ "Bearer" su vienu tarpu po jo
- ✅ Token vienoje eilutėje
- ❌ Ne "Bearer" naujoje eilutėje su token

---

#### 3. Expected Status Codes:
```
200 - OK (GET, login success)
201 - Created (register success)
400 - Bad Request (validation error)
401 - Unauthorized (no/bad token)
403 - Forbidden (valid token, insufficient permissions)
404 - Not Found (resource doesn't exist)
500 - Internal Server Error
```

---

## 🐛 Troubleshooting

### Problema 1: "Cannot POST /api/auth/register"

**Priežastis:** Backend neturi route

**Sprendimas:**
```bash
# Patikrinti ar failai deploy'inti
git status
git add .
git commit -m "Add auth routes"
git push origin main
```

---

### Problema 2: "401 Unauthorized" su valid token

**Priežastis:** Header formato klaida

**Sprendimas:**
```
# BLOGAI:
Authorization: Bearer
eyJhbGciOi...

# GERAI:
Authorization: Bearer eyJhbGciOi...
```

Arba naudok Thunder Client **Auth** tab!

---

### Problema 3: JWT_SECRET not defined

**Priežastis:** Environment variable nesetup'inta

**Sprendimas:**
```bash
# Railway Dashboard → Variables
JWT_SECRET=generated_64_char_string
JWT_EXPIRES_IN=24h

# Local .env
JWT_SECRET=your_secret_here
```

---

### Problema 4: bcrypt "illegal arguments"

**Priežastis:** Bando hash'inti null/undefined

**Sprendimas:**
```javascript
// Validacija PRIEŠ hashing
if (!password || password.length === 0) {
    return res.status(400).json({ error: 'Password required' });
}

const hash = await bcrypt.hash(password, 10);
```

---

## 🚀 Kitas Žingsnis

### Frontend Integration

**Ko reikės:**

1. **Login Page (`login.html`):**
```html
   <form id="loginForm">
       <input type="email" id="email" required>
       <input type="password" id="password" required>
       <button type="submit">Prisijungti</button>
   </form>
```

2. **Auth JavaScript (`js/auth.js`):**
```javascript
   // Login function
   async function login(email, password) {
       const response = await fetch(`${API_URL}/api/auth/login`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, password })
       });
       
       const data = await response.json();
       
       if (response.ok) {
           localStorage.setItem('token', data.token);
           localStorage.setItem('user', JSON.stringify(data.user));
           window.location.href = 'index.html'; // Dashboard
       }
   }
```

3. **Protected Pages:**
```javascript
   // Kiekvieno puslapio pradžioje
   function checkAuth() {
       const token = localStorage.getItem('token');
       
       if (!token) {
           window.location.href = 'login.html';
           return;
       }
       
       // Optional: verify token su backend
       verifyToken(token);
   }
   
   checkAuth();
```

4. **Logout:**
```javascript
   function logout() {
       localStorage.removeItem('token');
       localStorage.removeItem('user');
       window.location.href = 'login.html';
   }
```

---

## 📚 Papildomi Šaltiniai

### Documentation:
- [JWT.io](https://jwt.io/) - JWT debugger
- [bcrypt docs](https://github.com/kelektiv/node.bcrypt.js)
- [Express middleware guide](https://expressjs.com/en/guide/using-middleware.html)

### Best Practices:
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ Checklist

Kas padaryta:
- ✅ Users lentelė sukurta
- ✅ bcrypt password hashing
- ✅ JWT token generation
- ✅ Register endpoint
- ✅ Login endpoint
- ✅ Verify endpoint
- ✅ authenticateToken middleware
- ✅ Railway deployment
- ✅ Thunder Client testing

Kas liko:
- ⏳ Frontend login page
- ⏳ Session management
- ⏳ Protected routes integration
- ⏳ Logout functionality
- ⏳ Password reset (optional)
- ⏳ Email verification (optional)

---

**Sukurta:** 2026-01-29  
**Autorius:** Edgar Greenchuk  
**Projektas:** Sąskaitų Faktūrų Sistema