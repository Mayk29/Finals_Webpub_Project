const express = require('express');
const bodyParser = require('body-parser');
const customers = require('./customerList'); 

const app = express.Router();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const path = require('path');

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Returns all customers
app.get('/api/customers', (req, res) => {
    res.send(customers);
});

// Form submission route for creating a new customer
app.get('/api/customers/new', (req, res) => {
    res.sendFile(path.join(__dirname, 'new.html'));
});

// Fetches a specific customer by ID.
app.get('/api/customers/:id', (req, res) => {
    const customer = customers.find((c) => c.id === parseInt(req.params.id));
    if (!customer) return res.status(404).send('Customer ID not found.');
    else res.send(customer);
});

// Retrieves and displays parameters.
app.get('/api/customers/:id/:name/:email/:age/:location/:occupation', (req, res) => {
    res.send(req.params);
});

// Adds a new customer through form submission.
app.post('/api/customers', urlencodedParser, (req, res) => {
    // Prepare output in JSON format
    let response = {
        id: customers.length + 1, 
        name: req.body.name,
        email: req.body.email,
        age: req.body.age,
        location: req.body.location, 
        occupation: req.body.occupation 
    };

    customers.push(response);
    res.send(customers);
});

// Deletes a customer by ID.
app.delete('/api/delete/:id', (req, res) => {
    let customer = customers.find((c) => c.id === parseInt(req.params.id));
    if (!customer) return res.status(404).send('Customer ID not found.');
    else {
        let customerIndex = customers.findIndex((c) => c.id === parseInt(req.params.id));
        customers.splice(customerIndex, 1);
        res.send(customers);
    }
});

module.exports = app;