const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Product data
let products = [
    {
        id: 0,
        image: 'images/menu_2.jpg',
        title: 'Beef set',
        price: 329,
        desc: 'Beef meat set with all sides',
        category: 'meat',
    },
    {
        id: 1,
        image: 'images/menu_1.jpg',
        title: 'Pork belly and Beef set',
        price: 299,
        desc: 'Pork and Beef meat set with all sides',
        category: 'meat',
    },
    {
        id: 2,
        image: 'images/menu_3.jpg',
        title: 'Pork Belly set',
        price: 229,
        desc: "Pork Belly meat set with all sides",
        category: 'meat',
    },
    {
        id: 3,
        image: 'images/menu_6.jpg',
        title: 'Pork Jowl',
        price: 130,
        desc: 'Pork Jowl 500g',
        category: 'meat',
    },
    {
        id: 4,
        image: 'images/menu_7.jpg',
        title: 'Pork Belly',
        price: 168,
        desc: 'Pork Belly 500g',
        category: 'meat',
    },
    {
        id: 5,
        image: 'images/menu_8.jpg',
        title: 'Beef',
        price: 188,
        desc: 'Beef 500g',
        category: 'meat',
    },
    {
        id: 6,
        image: 'images/menu_9.jpg',
        title: 'Lettuce',
        price: 50,
        desc: 'Fresh Lettuce',
        category: 'dips-vege',
    },
    {
        id: 7,
        image: 'images/menu_10.jpg',
        title: 'Samgy Paste',
        price: 65,
        desc: 'Single serving of Samgy Paste',
        category: 'dips-vege',
    },
    {
        id: 8,
        image: 'images/menu_10.jpg',
        title: 'Samgy Cheese',
        price: 50,
        desc: 'Single serving of Samgy Cheese',
        category: 'dips-vege',
    },
    {
        id: 9,
        image: 'images/menu_11.jpg',
        title: 'Kimchi',
        price: 85,
        desc: 'Single serving of Kimchi',
        category: 'sides',
    },
    {
        id: 10,
        image: 'images/menu_12.jpg',
        title: 'Potato Marbles',
        price: 100,
        desc: 'Single serving of Potato Marbles',
        category: 'sides',
    },
    {
        id: 11,
        image: 'images/menu_13.jpg',
        title: 'Japchae',
        price: 100,
        desc: 'Single serving of Japchae',
        category: 'sides',
    },
    {
        id: 12,
        image: 'images/menu_14.jpg',
        title: 'Egg Roll',
        price: 120,
        desc: 'Single serving of Egg roll',
        category: 'sides',
    },
    {
        id: 13,
        image: 'images/menu_15.jpg',
        title: 'Glazed Kamote',
        price: 75,
        desc: 'Single serving of Glazed Kamote',
        category: 'sides',
    },
    {
        id: 14,
        image: 'images/menu_16.jpg',
        title: 'Macaroni Salad',
        price: 100,
        desc: 'Single serving of Macaroni Salad',
        category: 'sides',
    },
    {
        id: 15,
        image: 'images/menu_17.jpg',
        title: 'Kimbap',
        price: 120,
        desc: 'Single serving of Kimbap',
        category: 'sides',
    },
    {
        id: 16,
        image: 'images/menu_18.jpg',
        title: 'Fish Cake',
        price: 120,
        desc: 'Single serving of Fish Cake',
        category: 'sides',
    },
    {
        id: 17,
        image: 'images/menu_19.jpg',
        title: 'Tteokbokki',
        price: 120,
        desc: 'Single serving of Tteokbokki',
        category: 'sides',
    }
];

// Root route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Home</title>
        </head>
        <body>
            <h1>Welcome to PAPA J's Unli Samgy and Meat Shop API</h1>
            <button onclick="window.location.href='/cart.html'">Go to Cart</button>
        </body>
        </html>
    `);
});

// GET all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// POST a new product
app.post('/api/products', (req, res) => {
    const newProduct = { id: products.length + 1, ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// PUT (update) a product
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
        products[index] = { id: parseInt(id), ...req.body };
        res.json(products[index]);
    } else {
        res.status(404).send('Product not found');
    }
});

// DELETE a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter(p => p.id !== parseInt(id));
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});