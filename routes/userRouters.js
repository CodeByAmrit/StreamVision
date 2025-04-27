const express = require('express');
const router = express.Router();
const User = require('../models/user');
const checkAuth = require('../services/checkauth');
const { getAllDvrs } = require("../controllers/dvrController");
const bcrypt = require('bcrypt');
require('dotenv').config();

// Get all users
router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/change-password', (req, res) => {
    res.render("change-password");
});

router.get('/logout', checkAuth, (req, res) => {
    User.logout(req, res);
});

router.get('/dashboard', checkAuth, async (req, res) => {
    try {
        // Fetch any dashboard-specific data here (e.g., DVRs, Cameras, Stats)
        const dvrs = await getAllDvrs(); // Replace with actual DB/service call
        const total_dvrs = dvrs.length;
        const total_cameras = dvrs.reduce((count, dvr) => count + dvr.total_cameras, 0); // Example logic

        res.render("dashboard", {
            title: "Dashboard",
            user: req.user,
            total_dvrs,
            dvrs,
            total_cameras
        });
    } catch (error) {
        console.error("Dashboard loading error:", error);
        res.status(500).send("Something went wrong.");
    }
});

router.get('/', async (req, res) => {
    res.render("index");
});

router.get('/updates', (req, res) => {
    res.render('updates');
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

router.post('/change-password', checkAuth, async (req, res) => {
    try {
        const id = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'New passwords do not match.' });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        // Verify current password
        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Current password is incorrect.' });
        }

        // Hash new password and update
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await User.updatePassword(id, hashedPassword);

        return res.status(200).json({ status: 'success', message: 'Password changed successfully.' });

    } catch (error) {
        console.error('Error during password change:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
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