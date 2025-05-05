const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Rutas de los archivos de datos
const restaurantsPath = path.join(__dirname, '..', 'db', 'restaurants.json');
const dishesPath = path.join(__dirname, '..', 'db', 'dishes.json');

// Middleware para verificar si existe el archivo
const checkDataFile = (req, res, next) => {
  if (!fs.existsSync(restaurantsPath)) {
    // Crear archivo con datos de ejemplo si no existe
    const sampleData = [
      {
        id: 1,
        name: "Burger Palace",
        cuisine: "Comida Rápida",
        rating: 4.5,
        dishes: [
          { id: 1, name: "Hamburguesa Clásica", price: 25000, description: "Carne 100% res, queso cheddar y pan artesanal." },
          { id: 2, name: "Papas Fritas", price: 10000, description: "Papas crujientes con sal marina." }
        ]
      },
      {
        id: 2,
        name: "Pizza Heaven",
        cuisine: "Italiana",
        rating: 4.2,
        dishes: [
          { id: 3, name: "Pizza Margarita", price: 35000, description: "Salsa de tomate, mozzarella y albahaca fresca." },
          { id: 4, name: "Lasagna", price: 28000, description: "Capas de pasta, carne y queso gratinado." }
        ]
      }
    ];
    fs.writeFileSync(restaurantsPath, JSON.stringify(sampleData, null, 2));
  }
  next();
};

// Obtener todos los restaurantes
router.get('/', checkDataFile, (req, res) => {
  try {
    const restaurantsData = JSON.parse(fs.readFileSync(restaurantsPath, 'utf-8'));
    
    // Verificamos si estamos usando la estructura antigua o nueva
    if (restaurantsData.length > 0 && restaurantsData[0].dishIds) {
      // Estructura nueva con dishIds
      const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
      
      // Agregar los detalles de los platos a cada restaurante
      const restaurantsWithDishes = restaurantsData.map(restaurant => {
        const dishes = restaurant.dishIds.map(dishId => {
          return dishesData.find(dish => dish.id === dishId);
        }).filter(dish => dish !== undefined);
        
        return {
          ...restaurant,
          dishes: dishes
        };
      });
      
      res.json(restaurantsWithDishes);
    } else {
      // Estructura antigua con dishes incluidos
      res.json(restaurantsData);
    }
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    res.status(500).json({ message: 'Error al obtener restaurantes' });
  }
});

// Obtener un restaurante específico
router.get('/:id', checkDataFile, (req, res) => {
  try {
    const restaurantsData = JSON.parse(fs.readFileSync(restaurantsPath, 'utf-8'));
    const restaurant = restaurantsData.find(r => r.id === parseInt(req.params.id));
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    
    // Verificamos si estamos usando la estructura antigua o nueva
    if (restaurant.dishIds) {
      // Estructura nueva con dishIds
      const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
      
      // Obtener los detalles completos de los platos
      const dishes = restaurant.dishIds.map(dishId => {
        return dishesData.find(dish => dish.id === dishId);
      }).filter(dish => dish !== undefined);
      
      // Crear una copia del restaurante con los platos completos
      const restaurantWithDishes = {
        ...restaurant,
        dishes: dishes
      };
      
      res.json(restaurantWithDishes);
    } else {
      // Estructura antigua con dishes incluidos
      res.json(restaurant);
    }
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    res.status(500).json({ message: 'Error al obtener restaurante' });
  }
});

// Obtener los platos de un restaurante
router.get('/:id/dishes', checkDataFile, (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(restaurantsPath, 'utf-8'));
    const restaurant = data.find(r => r.id === parseInt(req.params.id));
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    
    res.json(restaurant.dishes);
  } catch (error) {
    console.error('Error al obtener platos del restaurante:', error);
    res.status(500).json({ message: 'Error al obtener platos del restaurante' });
  }
});

module.exports = router;