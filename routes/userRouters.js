const express = require('express');
const router = express.Router();
const User = require('../models/user');
const checkAuth = require('../services/checkAuth');
require('dotenv').config()


// Get all users
router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/logout', checkAuth, (req, res) => {
    User.logout(req, res);
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await User.login(req, res);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
        
    }
});



// router.post('/signup', async (req, res) => {
//     try {
       
//         const result = await User.create( req.body);
//         if (result.id){
//             res.status(201).json({ status: 'success', message: 'User created successfully' });
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).send('Internal Server Error');
        
//     }
// });



module.exports = router;