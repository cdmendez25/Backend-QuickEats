const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

const JWT_SECRET = 'clave_super_secreta';

app.use(cors({ origin: 'http://localhost:5173' }));
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

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));