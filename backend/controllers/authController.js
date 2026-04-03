const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils');
const { createUser, findUserByEmail, findUserById, updateUserProfile } = require('../db-supabase');

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'auth.log');
const log = (msg) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

exports.signup = async (req, res) => {
    try {
        let { email, password, name } = req.body;
        
        // Trim inputs to prevent whitespace issues
        email = email?.trim().toLowerCase();
        password = password?.trim();
        name = name?.trim();

        log(`Signup attempt: email=${email}, name=${name}, passwordLength=${password?.length}`);

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists with this email' });
        }

        // Create user in Supabase - Hashing is handled in the data layer (db-supabase)
        const newUser = await createUser(email, password, name);

        // Generate JWT token
        const token = generateToken(newUser);

        // Return user info and token (excluding password)
        res.status(201).json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            },
            token
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        
        // Trim inputs to prevent whitespace issues
        email = email?.trim().toLowerCase();
        password = password?.trim();

        log(`Login attempt for: ${email}, passwordLength=${password?.length}`);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Find user
        const user = await findUserByEmail(email);
        log(`User found in DB for login: ${user ? 'Yes' : 'No'}`);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        log(`Bcrypt comparison for ${email}: ${isMatch}`);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return user info and token
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, error: 'Failed to login' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        const updatedUser = await updateUserProfile(req.user.id, name);
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
};
