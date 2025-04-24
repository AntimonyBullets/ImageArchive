// Configuration file for API URLs
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/v1'
    : 'https://YOUR_BACKEND_URL_HERE.onrender.com/api/v1';

export { API_BASE_URL }; 