const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ruta del archivo de datos
const ordersPath = path.join(__dirname, '..', 'db', 'orders.json');

const checkDataFile = (req, res, next) => {
  if (!fs.existsSync(ordersPath)) {
    const sampleData = [
      { id: 1, cliente: 'Carlos Díaz', total: 42000, estado: 'Completado', items: [{ id: 1, name: 'Hamburguesa Clásica', price: 25000, quantity: 1 }, { id: 2, name: 'Papas Fritas', price: 10000, quantity: 1 }] },
      { id: 2, cliente: 'Laura Rojas', total: 38500, estado: 'Pendiente', items: [{ id: 3, name: 'Pizza Margarita', price: 35000, quantity: 1 }] },
      { id: 3, cliente: 'Isabella Pérez', total: 27000, estado: 'Cancelado', items: [{ id: 4, name: 'Lasagna', price: 28000, quantity: 1 }] }
    ];
    fs.writeFileSync(ordersPath, JSON.stringify(sampleData, null, 2));
  }
  next();
};
const onlyPos = (req, res, next) => {
  if (req.user?.role !== 'pos') {
    return res.status(403).json({ message: 'Acceso solo permitido para POS' });
  }
  next();
};

// Obtener todas las órdenes
router.get('/', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  res.json(data);
});

// Obtener una orden específica
router.get('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const order = data.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  
  res.json(order);
});

// Crear una nueva orden
router.post('/', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const newOrder = {
    id: data.length > 0 ? Math.max(...data.map(o => o.id)) + 1 : 1,
    cliente: req.user?.email || 'cliente@desconocido.com',
    total: req.body.total,
    items: req.body.items,
    estado: 'Pendiente',
    fecha: new Date().toISOString()
  };
  
  data.push(newOrder);
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
  
  res.status(201).json(newOrder);
});

// Actualizar una orden
router.put('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const index = data.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  
  data[index] = { ...data[index], ...req.body };
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
  
  res.json(data[index]);
});

// Cancelar una orden
router.put('/:id/cancel', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const index = data.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  
  data[index].estado = 'Cancelado';
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
  
  res.json(data[index]);
});

// Eliminar una orden
router.delete('/:id', checkDataFile, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const index = data.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }
  
  const deletedOrder = data.splice(index, 1)[0];
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));
  
  res.json(deletedOrder);
});

router.patch('/:id/estado', checkDataFile, onlyPos, (req, res) => {
  const data = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  const index = data.findIndex(o => o.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: 'Orden no encontrada' });
  }

  const nuevoEstado = req.body.estado;

  if (!['Pendiente', 'Cancelado'].includes(nuevoEstado)) {
    return res.status(400).json({ message: 'Estado no válido. Solo se permite "Pendiente" o "Cancelado".' });
  }

  data[index].estado = nuevoEstado;
  fs.writeFileSync(ordersPath, JSON.stringify(data, null, 2));

  res.json({ message: 'Estado actualizado correctamente', order: data[index] });
});

module.exports = router;