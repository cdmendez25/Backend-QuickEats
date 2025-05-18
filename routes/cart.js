const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const cartPath = path.join(__dirname, '..', 'db', 'cart.json');

const readCart = () => {
  if (!fs.existsSync(cartPath)) return [];
  return JSON.parse(fs.readFileSync(cartPath, 'utf8'));
};

const saveCart = (cart) => {
  fs.writeFileSync(cartPath, JSON.stringify(cart, null, 2));
};

router.get('/', (req, res) => {
  const cart = readCart();
  res.json(cart);
});

router.post('/checkout', (req, res) => {
  const cart = readCart();

  if (cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío' });
  }

  const ordersPath = path.join(__dirname, '..', 'db', 'orders.json');
  const existingOrders = fs.existsSync(ordersPath)
    ? JSON.parse(fs.readFileSync(ordersPath, 'utf8'))
    : [];

  const items = cart.map(item => ({
    id: item.id,
    name: item.nombre,
    price: Number(item.precio),
    quantity: Number(item.cantidad)
  }));

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (isNaN(total)) {
    return res.status(500).json({ message: 'Error al calcular el total. Verifica los datos del carrito.' });
  }
  const newOrder = {
    id: existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.id)) + 1 : 1,
    cliente: req.user?.email || 'cliente@desconocido.com',
    total: total,
    estado: 'Pendiente',
    fecha: new Date().toISOString(),
    items
  };
  const dishesPath = path.join(__dirname, '..', 'db', 'dishes.json');
  const dishes = fs.existsSync(dishesPath)
    ? JSON.parse(fs.readFileSync(dishesPath, 'utf8'))
    : [];

  newOrder.items.forEach(item => {
    const index = dishes.findIndex(d => d.id === item.id);
    if (index !== -1) {
      dishes[index].stock = Math.max(dishes[index].stock - item.quantity, 0); // para que no quede negativo
    }
  });

fs.writeFileSync(dishesPath, JSON.stringify(dishes, null, 2));

  existingOrders.push(newOrder);
  fs.writeFileSync(ordersPath, JSON.stringify(existingOrders, null, 2));

  saveCart([]);

  res.status(201).json({ message: 'Pedido confirmado', order: newOrder });
});

router.post('/', (req, res) => {
  const { id, nombre, precio, cantidad } = req.body;

  if (!id || !nombre || !precio || !cantidad) {
    return res.status(400).json({ message: 'Faltan campos: id, nombre, precio o cantidad' });
  }

  const cart = readCart();

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.cantidad += cantidad;
  } else {
    cart.push({ id, nombre, precio, cantidad });
  }

  saveCart(cart);
  res.status(201).json({ message: 'Producto agregado al carrito', cart });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let cart = readCart();

  const index = cart.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
  }

  const deletedItem = cart.splice(index, 1);
  saveCart(cart);
  res.json({ message: 'Producto eliminado', deleted: deletedItem[0] });
});

module.exports = router;