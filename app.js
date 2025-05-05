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

// Asegurar que la carpeta db exista
const dbPath = path.join(__dirname, 'db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

// Configurar CORS para permitir solicitudes desde el frontend
app.use(cors({ 
  origin: [FRONTEND_URL, 'https://tu-frontend-url.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Rutas de autenticación
app.use('/auth', require('./routes/auth')(JWT_SECRET));

// Rutas de restaurantes
app.use('/restaurants', require('./routes/restaurants'));

// Rutas de platos
app.use('/dishes', require('./routes/dishes'));

// Rutas de órdenes
app.use('/orders', require('./routes/orders'));

// Middleware para verificar token (para rutas protegidas)
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

// Ejemplo de ruta protegida
app.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'API de QuickEats funcionando correctamente' });
});

module.exports = app;