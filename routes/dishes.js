const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ruta del archivo de datos
const dishesPath = path.join(__dirname, '..', 'db', 'dishes.json');

// Middleware para verificar si existe el archivo
const checkDataFile = (req, res, next) => {
  if (!fs.existsSync(dishesPath)) {
    // Crear archivo con datos de ejemplo si no existe
    const sampleData = [
      { id: 1, name: "Hamburguesa Clásica", price: 25000, description: "Carne 100% res, queso cheddar y pan artesanal.", available: true },
      { id: 2, name: "Papas Fritas", price: 10000, description: "Papas crujientes con sal marina.", available: true },
      { id: 3, name: "Pizza Margarita", price: 35000, description: "Salsa de tomate, mozzarella y albahaca fresca.", available: true },
      { id: 4, name: "Lasagna", price: 28000, description: "Capas de pasta, carne y queso gratinado.", available: true }
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
    ...req.body
  };
  
  data.push(newDish);
  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));
  
  res.status(201).json(newDish);
});

// Actualizar un plato
router.put('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
  const index = data.findIndex(d => d.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Plato no encontrado' });
  }
  
  data[index] = { ...data[index], ...req.body };
  fs.writeFileSync(dishesPath, JSON.stringify(data, null, 2));
  
  res.json(data[index]);
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

module.exports = router;