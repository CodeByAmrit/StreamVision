const express = require('express');
const router = express.Router();
const User = require('../models/user');
const checkAuth = require('../services/checkauth');
const { getAllDvrs } = require("../controllers/dvrController");
const dvrManager = require('../utils/streamManager');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Get all users
router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/logout', checkAuth, (req, res) => {
    User.logout(req, res);
});

// routes/dashboard.js
router.get('/dashboard', checkAuth, async (req, res) => {
    try {
        // 1. Fetch all DVRs from DB
        const dvrs = await getAllDvrs();

        // 2. Build active DVR summary from Map
        const activeDvrsSummary = {};

        for (const [dvrId, streamInstance] of dvrManager.streams.entries()) {
            activeDvrsSummary[dvrId] = {
                dvr_id: dvrId,
                activeCameraCount: streamInstance.activeCameraCount || 1,
                lastActivity: streamInstance.lastAccess || Date.now(),
            };
        }

        // 3. Merge active DVRs with full DVR details
        const activeDvrsWithDetails = dvrs
            .filter(dvr => activeDvrsSummary[dvr.id])
            .map(dvr => ({
                ...dvr,
                ...activeDvrsSummary[dvr.id],
            }));

        // 4. Dashboard statistics
        const total_dvrs = dvrs.length;
        const total_cameras = dvrs.reduce(
            (count, dvr) => count + (dvr.total_cameras || 0),
            0
        );

        const active_streams = dvrManager.streams.size;

        // 5. Render dashboard
        res.render("dashboard", {
            title: "Dashboard",
            user: req.user,
            total_dvrs,
            total_cameras,
            active_streams,
            dvrs,
            activeDvrs: activeDvrsWithDetails,
        });

    } catch (error) {
        console.error("Dashboard loading error:", error);
        res.status(500).send("Something went wrong loading the dashboard.");
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

        await User.updatePassword(id, newPassword);

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