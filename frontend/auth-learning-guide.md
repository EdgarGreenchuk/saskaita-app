# 🔐 Authentication Sistema - Mokymosi Vadovas

**Data:** 2026-01-30  
**Autorius:** Edgar Greenchuk  
**Projektas:** Sąskaitų Faktūrų Sistema  
**Technologijos:** Node.js, Express, PostgreSQL, JWT, bcrypt

---

## 📑 Turinys

1. [Kas yra auth.js?](#kas-yra-authjs)
2. [Architektūra - Object Pattern](#architektūra---object-pattern)
3. [localStorage API](#localstorage-api)
4. [Token Expiry Logic](#token-expiry-logic)
5. [Async/Await](#asyncawait)
6. [Fetch API](#fetch-api)
7. [Page Protection Pattern](#page-protection-pattern)
8. [API Request Wrapper](#api-request-wrapper)
9. [DOM Manipulation](#dom-manipulation)
10. [Error Handling](#error-handling)
11. [JSON Handling](#json-handling)
12. [Naujos JavaScript Koncepcijos](#naujos-javascript-koncepcijos)
13. [Security Concepts](#security-concepts)
14. [Flow Diagrams](#flow-diagrams)
15. [Summary](#summary)

---

## 🎯 Kas yra auth.js?

**auth.js** - tai centralizuotas authentication service, kuris valdo:

- ✅ Token saugojimą ir galiojimą
- ✅ User login/logout/register
- ✅ Puslapių apsaugojimą
- ✅ Authenticated API requests
- ✅ UI atnaujinimus

**Vieta projekte:** `frontend/js/auth.js`

---

## 🏗️ Architektūra - Object Pattern

### AuthService Object (Service Pattern)

```javascript
const AuthService = {
    // Properties
    get API_URL() { ... },
    
    // Methods
    saveToken() { ... },
    getToken() { ... },
    login() { ... }
};
```

### Ką išmokome:

- ✅ **Object as Service** - viskas viename objekte (organizuotas kodas)
- ✅ **Getter property** - `get API_URL()` automatiškai grąžina vertę
- ✅ **this keyword** - `this.getToken()` kviečia kitus metodus

### Kodėl taip?

**❌ Blogai - funkcijos visur:**
```javascript
function saveToken() { }
function getToken() { }
function login() { }
```

**✅ Gerai - viename objekte:**
```javascript
AuthService.saveToken();
AuthService.getToken();
AuthService.login();
```

---

## 🔐 localStorage API

### Kas tai?

Browser saugykla, kuri išlaiko duomenis net uždarant tab/browser.

### Pagrindiniai metodai:

```javascript
// 1. SAVE (įrašyti)
localStorage.setItem('key', 'value');

// 2. GET (gauti)
const value = localStorage.getItem('key');

// 3. REMOVE (ištrinti)
localStorage.removeItem('key');

// 4. CLEAR ALL (išvalyti viską)
localStorage.clear();
```

### Mūsų naudojimas:

```javascript
// Išsaugojame token
saveToken(token, expiresIn = 86400000) {
    localStorage.setItem('token', token);
    
    // Išsaugojame kada pasibaigs
    const expiresAt = Date.now() + expiresIn;
    localStorage.setItem('tokenExpiry', expiresAt.toString());
}
```

### Ką išmokome:

- ✅ `Date.now()` - dabartinis timestamp milliseconds
- ✅ `.toString()` - konvertuoti number → string
- ✅ **Default parameters** - `expiresIn = 86400000`

---

## ⏰ Token Expiry Logic

### Problema:

Token negali galioti amžinai (security risk)

### Sprendimas:

Saugome token **IR** expiry timestamp:

```javascript
getToken() {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    // Patikrinti ar pasibaigė
    if (Date.now() > parseInt(expiry)) {
        this.clearAuth();  // Išvalyti
        return null;
    }
    
    return token;
}
```

### Ką išmokome:

- ✅ `parseInt()` - string → number
- ✅ **Timestamp comparison** - `Date.now() > expiry`
- ✅ **Early return pattern** - grąžina `null` jei pasibaigė

### Vizualizacija:

```
Token created: 2026-01-30 10:00 (timestamp: 1738234800000)
Expires in:    24 hours          (86400000 ms)
Expires at:    2026-01-31 10:00 (timestamp: 1738321200000)

If Date.now() > 1738321200000 → EXPIRED ❌
```

---

## 🔄 Async/Await

### Problema:

API calls užtrunka (network delay). Negalime "freeze" puslapio.

### Sprendimas: async/await

**❌ OLD WAY - Callbacks (callback hell):**
```javascript
fetch(url).then(response => {
    return response.json();
}).then(data => {
    console.log(data);
}).catch(error => {
    console.error(error);
});
```

**✅ NEW WAY - async/await:**
```javascript
async login(email, password) {
    try {
        const response = await fetch(`${this.API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        return { success: true, user: data.user };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

### Ką išmokome:

- ✅ `async` - funkcija grąžins Promise
- ✅ `await` - palaukti kol Promise resolve'inasi
- ✅ `try/catch` - error handling su async
- ✅ Kodas atrodo "synchronous" bet veikia async!

### Vizualizacija:

```
1. const response = await fetch(...)  // WAIT HERE ⏳
2. const data = await response.json() // WAIT HERE ⏳
3. return data                        // CONTINUE ✅
```

---

## 🌐 Fetch API

### Kas tai?

Browser built-in funkcija HTTP requests (kaip Axios, bet native).

### Basic struktura:

```javascript
fetch(url, {
    method: 'POST',          // GET, POST, PUT, DELETE
    headers: {               // Meta informacija
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123'
    },
    body: JSON.stringify({   // Data (tik POST/PUT)
        email: 'test@test.lt',
        password: '12345'
    })
})
```

### Response handling:

```javascript
const response = await fetch(url);

// Check status
if (!response.ok) {          // status 200-299 = ok
    throw new Error('Failed');
}

// Parse JSON
const data = await response.json();
```

### Ką išmokome:

- ✅ `response.ok` - boolean (true jei 200-299)
- ✅ `response.status` - HTTP status code (200, 401, 500...)
- ✅ `response.json()` - parse JSON response
- ✅ `JSON.stringify()` - object → JSON string

---

## 🛡️ Page Protection Pattern

### Problema:

Vartotojas gali tiesiogiai rašyti `dashboard.html` URL neprisijungęs.

### Sprendimas: requireAuth()

```javascript
async requireAuth() {
    // 1. Patikrinti ar yra token
    if (!this.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    
    // 2. Patikrinti ar token valid su backend
    const isValid = await this.verifyToken();
    if (!isValid) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}
```

### Naudojimas puslapyje:

```javascript
// IIFE - Immediately Invoked Function Expression
(async function() {
    const isAuth = await AuthService.requireAuth();
    if (isAuth) {
        console.log('✅ User authenticated');
    }
})();
```

### Ką išmokome:

- ✅ **IIFE pattern** - `(function() { })()` iškart vykdo
- ✅ `window.location.href` - redirect į kitą puslapį
- ✅ **Guard pattern** - early return jei ne OK
- ✅ **async IIFE** - `(async function() { })()`

### Vizualizacija:

```
User → dashboard.html
         ↓
    requireAuth() check
         ↓
    Has token? → NO → redirect login.html ❌
         ↓ YES
    Token valid? → NO → redirect login.html ❌
         ↓ YES
    Show dashboard ✅
```

---

## 🔄 API Request Wrapper

### Problema:

Kiekviename API call kartoti token injection ir error handling.

### Sprendimas: apiRequest() helper

```javascript
async apiRequest(endpoint, options = {}) {
    const token = this.getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    // Merge options
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(`${this.API_URL}${endpoint}`, mergedOptions);
    
    // Auto-handle 401 (unauthorized)
    if (response.status === 401) {
        this.clearAuth();
        window.location.href = 'login.html';
    }
    
    return response;
}
```

### Naudojimas:

**❌ Prieš (daug kodo):**
```javascript
fetch(`${API_URL}/api/clients`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});
```

**✅ Dabar (trumpai):**
```javascript
AuthService.apiRequest('/api/clients');
```

### Ką išmokome:

- ✅ **Spread operator** - `...defaultOptions` (copy object)
- ✅ **Object merging** - combine multiple objects
- ✅ **DRY principle** - Don't Repeat Yourself
- ✅ **Wrapper pattern** - funkcija aplink funkciją (prideda funkcionalumą)

---

## 🎨 DOM Manipulation

### updateUserUI() metodas:

```javascript
updateUserUI() {
    const user = this.getUser();
    
    // Find ALL elements with class 'user-name'
    const userNameElements = document.querySelectorAll('.user-name');
    
    // Update each one
    userNameElements.forEach(el => {
        el.textContent = user.fullName || user.email;
    });
}
```

### Ką išmokome:

- ✅ `querySelectorAll()` - grąžina **NodeList** (array-like)
- ✅ `.forEach()` - iterate per elements
- ✅ `.textContent` - update text (safe - ne HTML)
- ✅ **OR operator** - `user.fullName || user.email` (fallback)

---

## 🚨 Error Handling

### 1. Try-Catch su async/await:

```javascript
async login(email, password) {
    try {
        const response = await fetch(...);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        return { success: true, user: data.user };
        
    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
    }
}
```

### Ką išmokome:

- ✅ `throw new Error()` - sukurti error
- ✅ `catch(error)` - pagauti error
- ✅ `error.message` - error tekstas
- ✅ **Graceful error handling** - grąžinti `{success: false}` vietoj crash

### 2. Consistent return pattern:

```javascript
// VISADA grąžina tą patį formato object
return { success: true, user: data.user };
return { success: false, error: error.message };
```

**Kodėl gerai:**
```javascript
const result = await AuthService.login(email, password);

if (result.success) {
    console.log('Logged in:', result.user);
} else {
    console.log('Error:', result.error);
}
```

---

## 🧩 JSON Handling

### JSON.stringify() vs JSON.parse()

```javascript
// Object → JSON string (sending to API)
const user = { name: 'Edgar', age: 38 };
const jsonString = JSON.stringify(user);
// → '{"name":"Edgar","age":38}'

// JSON string → Object (receiving from API)
const userStr = '{"name":"Edgar","age":38}';
const userObj = JSON.parse(userStr);
// → { name: 'Edgar', age: 38 }
```

### Mūsų naudojimas:

```javascript
// SAVE to localStorage (tik strings!)
saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// GET from localStorage
getUser() {
    const userStr = localStorage.getItem('user');
    return JSON.parse(userStr);
}
```

### Ką išmokome:

- ✅ localStorage saugo TIK strings
- ✅ Objects → stringify prieš saugant
- ✅ Parse atgal į object kai reikia naudoti

---

## 🎓 Naujos JavaScript Koncepcijos

### 1. Template Literals (backticks)

**❌ OLD:**
```javascript
const url = API_URL + '/api/auth/login';
```

**✅ NEW:**
```javascript
const url = `${API_URL}/api/auth/login`;
```

### 2. Arrow Functions

**❌ OLD:**
```javascript
userNameElements.forEach(function(el) {
    el.textContent = user.name;
});
```

**✅ NEW:**
```javascript
userNameElements.forEach(el => {
    el.textContent = user.name;
});
```

### 3. Ternary Operator

**❌ OLD:**
```javascript
let name;
if (user.fullName) {
    name = user.fullName;
} else {
    name = user.email;
}
```

**✅ NEW:**
```javascript
const name = user.fullName ? user.fullName : user.email;

// EVEN BETTER:
const name = user.fullName || user.email;
```

### 4. Object Destructuring (bonus)

**❌ OLD:**
```javascript
const email = user.email;
const fullName = user.fullName;
const role = user.role;
```

**✅ NEW:**
```javascript
const { email, fullName, role } = user;
```

---

## 📊 Security Concepts

### 1. Token Expiration

```javascript
// Token galioja 24h, po to invalid
const expiresAt = Date.now() + 86400000;
```

### 2. Bearer Token Pattern

```javascript
headers: {
    'Authorization': 'Bearer eyJhbGc...'
}
```

### 3. Auto-logout on 401

```javascript
if (response.status === 401) {
    this.clearAuth();
    window.location.href = 'login.html';
}
```

### 4. Token in every request

```javascript
// Backend visada gali patikrinti ar valid
headers: { 'Authorization': `Bearer ${token}` }
```

---

## 🎯 Flow Diagrams

### LOGIN FLOW:

```
User → login.html → enter email/password
  ↓
AuthService.login(email, password)
  ↓
POST /api/auth/login → Backend
  ↓
Backend → check password → generate JWT
  ↓
Response: { token, user }
  ↓
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))
  ↓
Redirect → dashboard.html
```

### PAGE LOAD FLOW:

```
User → dashboard.html
  ↓
requireAuth() check
  ↓
Has token? → getToken() from localStorage
  ↓ YES
Token expired? → check Date.now() vs expiry
  ↓ NO
Verify with backend → POST /api/auth/verify
  ↓ VALID
Show page + updateUserUI()
```

### API REQUEST FLOW:

```
Component → AuthService.apiRequest('/api/clients')
  ↓
Get token from localStorage
  ↓
Inject Authorization header
  ↓
fetch(url, { headers: { Authorization: Bearer token } })
  ↓
Response status 401? → logout()
  ↓ NO
Return response
```

---

## ✅ Summary

### JavaScript Koncepcijos:

- ✅ Objects as Services (organization pattern)
- ✅ async/await (asynchronous programming)
- ✅ try/catch error handling
- ✅ Fetch API (HTTP requests)
- ✅ Template literals
- ✅ Arrow functions
- ✅ Spread operator (...obj)
- ✅ IIFE pattern

### Browser APIs:

- ✅ localStorage (setItem, getItem, removeItem)
- ✅ window.location.href (redirects)
- ✅ document.querySelectorAll (DOM)
- ✅ element.textContent (DOM manipulation)

### Web Development Patterns:

- ✅ Token-based authentication
- ✅ JWT (JSON Web Tokens)
- ✅ Bearer token authorization
- ✅ Page protection (auth guards)
- ✅ API request wrappers
- ✅ Centralized services

### Security Concepts:

- ✅ Token expiration
- ✅ Auto-logout on unauthorized
- ✅ Secure storage (localStorage limits)
- ✅ 401 handling

### Best Practices:

- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent error handling
- ✅ Graceful degradation
- ✅ User feedback (console.log)

---

## 🚀 Ką galima naudoti kitur:

Šie patterns veikia ne tik auth - gali naudoti:

- ✅ **apiRequest()** - bet kokiems API calls
- ✅ **async/await** - bet kur reikia laukti
- ✅ **localStorage** - theme settings, user preferences
- ✅ **Service objects** - data management, utilities
- ✅ **Error handling** - visur kur gali būti errors

---

**Sukurta:** 2026-01-30  
**Autorius:** Edgar Greenchuk  
**Projektas:** Sąskaitų Faktūrų Sistema

📚 Mokymosi dokumentacija - auth.js funkcionalumas
