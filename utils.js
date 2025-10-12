const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'whatsapp_secret_key',
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET || 'whatsapp_secret_key'
    );
};

module.exports = {
    generateToken,
    verifyToken
};