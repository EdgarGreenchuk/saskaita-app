// config.js - API Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'  // Local development
  : 'https://saskaita-app-production.up.railway.app/api'; // Production Railway

console.log('🚀 API URL:', API_URL); // Debug - pamatysi console kokį URL naudoja
