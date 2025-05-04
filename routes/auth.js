const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

module.exports = function(JWT_SECRET) {
  const router = express.Router();

  // Ruta de users.json
  const usersPath = path.join(__dirname, '..', 'db', 'users.json');

  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const usersData = fs.readFileSync(usersPath, 'utf-8');
    const users = JSON.parse(usersData);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  });

  return router;
};