const express = require('express');
const app = express();
const users = require('./routes/users');
const posts = require('./routes/posts');
const session = require('express-session');

app.use
    (session({ 
        secret: 'mysecretstring',
        resave: false,
        saveUninitialized: false
    }));

app.get('/reqcount', (req, res) => {
    if (req.session.count) {
        req.session.count++;
    } else {
        req.session.count = 1;
    }
   
    res.send(`You sent a request ${req.session.count} times`);
    
});

app.get('/test', (req, res) => {
    res.send('Test route is working!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});