const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ruta del archivo de datos
const dishesPath = path.join(__dirname, '..', 'db', 'dishes.json');

// Middleware para verificar si existe el archivo
const checkDataFile = (req, res, next) => {
  if (!fs.existsSync(dishesPath)) {
    const sampleData = [
      { id: 1, name: "Hamburguesa Clásica", price: 25000, description: "Carne 100% res, queso cheddar y pan artesanal.", available: true, stock: 10, comments: [] },
      { id: 2, name: "Papas Fritas", price: 10000, description: "Papas crujientes con sal marina.", available: true, stock: 15, comments: [] },
      { id: 3, name: "Pizza Margarita", price: 35000, description: "Salsa de tomate, mozzarella y albahaca fresca.", available: true, stock: 8, comments: [] },
      { id: 4, name: "Lasagna", price: 28000, description: "Capas de pasta, carne y queso gratinado.", available: true, stock: 12, comments: [] }
    ];
    fs.writeFileSync(dishesPath, JSON.stringify(sampleData, null, 2));
  }
  next();
};

// Obtener todos los platos
router.get('/', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  res.json(data);
});

// Obtener un plato específico
router.get('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const dish = data.find(d => d.id === parseInt(req.params.id));

  if (!dish) {
    return res.status(404).json({ message: 'Plato no encontrado' });
  }

  res.json(dish);
});

// Crear un nuevo plato
router.post('/', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const newDish = {
    id: data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1,
    comments: [],
    ...req.body
  };

  data.push(newDish);
  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));

  res.status(201).json(newDish);
});

// ✅ Actualizar un plato (MODIFICADO)
router.put('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const index = data.findIndex(d => d.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Plato no encontrado' });
  }

  const updatedDish = {
    ...data[index],
    ...req.body,
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    available: req.body.available === true || req.body.available === 'yes'
  };

  data[index] = updatedDish;
  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));

  res.json(updatedDish);
});

// Eliminar un plato
router.delete('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const index = data.findIndex(d => d.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Plato no encontrado' });
  }

  const deletedDish = data.splice(index, 1)[0];
  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));

  res.json(deletedDish);
});

// Agregar comentario
router.post('/:id/comments', checkDataFile, (req, res) => {
  const { user, text } = req.body;

  if (!user || !text) {
    return res.status(400).json({ message: 'Faltan campos: user o text' });
  }

  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const dish = data.find(d => d.id === parseInt(req.params.id));

  if (!dish) {
    return res.status(404).json({ message: 'Plato no encontrado' });
  }

  if (!dish.comments) dish.comments = [];
  dish.comments.push({ user, text });

  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));
  res.status(201).json({ message: 'Comentario agregado' });
});

module.exports = router;