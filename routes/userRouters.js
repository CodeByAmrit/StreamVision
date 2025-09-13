const express = require('express');
const router = express.Router();
const User = require('../models/user');
const checkAuth = require('../services/checkauth');
const { getAllDvrs } = require("../controllers/dvrController");
const { activeStreams } = require('../utils/streamManager');
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

// routes/dashboard.js
router.get('/dashboard', checkAuth, async (req, res) => {
    try {
        // 1. Fetch all DVRs from your database
        const dvrs = await getAllDvrs();

        // 2. Group all currently active streams by their DVR ID
        const activeDvrsSummary = Object.values(activeStreams).reduce((acc, stream) => {
            const dvrId = stream.camera_details.dvr_id;
            
            if (!acc[dvrId]) {
                // Initialize the entry if it's the first camera from this DVR
                acc[dvrId] = {
                    dvr_id: dvrId,
                    activeCameraCount: 0,
                    lastActivity: 0
                };
            }

            acc[dvrId].activeCameraCount++;
            if (stream.lastAccess > acc[dvrId].lastActivity) {
                acc[dvrId].lastActivity = stream.lastAccess;
            }
            
            return acc;
        }, {});

        // 3. Create a new array containing ONLY active DVRs, but with their FULL details
        const activeDvrsWithDetails = dvrs
            .filter(dvr => activeDvrsSummary[dvr.id]) // Keep only DVRs that have an entry in the summary
            .map(dvr => {
                // Merge the full DVR object with its corresponding activity summary
                return {
                    ...dvr, // e.g., { id, dvr_name, location_name, ... }
                    ...activeDvrsSummary[dvr.id] // e.g., { activeCameraCount, lastActivity }
                };
            });

        // 4. Calculate final statistics for the dashboard cards
        const total_dvrs = dvrs.length;
        const total_cameras = dvrs.reduce((count, dvr) => count + (dvr.total_cameras || 0), 0);
        const active_streams_count = Object.keys(activeStreams).length;

        // 5. Render the EJS template with all the necessary data
        res.render("dashboard", {
            title: "Dashboard",
            user: req.user,
            total_dvrs: total_dvrs,
            dvrs: dvrs, // Full list of all DVRs
            total_cameras: total_cameras,
            active_streams: active_streams_count,
            activeDvrs: activeDvrsWithDetails, // The final, detailed list of active DVRs
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