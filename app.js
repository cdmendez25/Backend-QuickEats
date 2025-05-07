const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3001;

const dbPath = path.join(__dirname, 'db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

const allowedOrigins = [ 
  FRONTEND_URL
]; 

app.use(cors({ 
  origin: function (origin, callback) { 
    if (!origin || allowedOrigins.includes(origin)) { 
      callback(null, true); 
    } else { 
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error('Not allowed by CORS')); 
    } 
  }, 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'] 
})); 

app.options('*', cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

app.use('/auth', require('./routes/auth')(JWT_SECRET));
app.use('/restaurants', verifyToken, require('./routes/restaurants'));
app.use('/dishes', verifyToken, require('./routes/dishes'));
app.use('/orders', verifyToken, require('./routes/orders'));

app.get('/test', (req, res) => {
  res.json({ 
    message: 'API de QuickEats funcionando correctamente',
    environment: process.env.NODE_ENV,
    corsOrigins: allowedOrigins,
    requestOrigin: req.headers.origin || 'No origin header'
  });
});

app.get('/', (req, res) => {
  res.send('Backend QuickEats funcionando');
});

module.exports = app;