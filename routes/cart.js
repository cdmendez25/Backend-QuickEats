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
    price: item.precio,
    quantity: item.cantidad
  }));

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const newOrder = {
    id: existingOrders.length > 0 ? Math.max(...existingOrders.map(o => o.id)) + 1 : 1,
    cliente: req.user?.email || 'cliente@desconocido.com',
    total: total,
    estado: 'Pendiente',
    fecha: new Date().toISOString(),
    items
  };

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