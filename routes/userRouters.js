const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
require('dotenv').config()


// Get all users
router.get('/login', (req, res) => {
    res.render("login");
});
router.get('/dashboard', (req, res) => {
    res.render("dashboard");
});



module.exports = router;