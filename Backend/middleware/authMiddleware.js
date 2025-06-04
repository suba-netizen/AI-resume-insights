// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
    console.log('--- [AUTH MIDDLEWARE START] ---');
    console.log(`[AUTH] Request Path: ${req.originalUrl}, Method: ${req.method}`);
    const authHeader = req.header('Authorization');
    console.log('[AUTH] Authorization Header:', authHeader ? "Present" : "MISSING!");

    if (!authHeader) {
        console.log('[AUTH ERROR] No token in Authorization header. Sending 401 JSON.');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer' || !tokenParts[1]) {
        console.log('[AUTH ERROR] Token format invalid (expecting "Bearer <token>"). Header was:', authHeader, '. Sending 401 JSON.');
        return res.status(401).json({ msg: 'Token format invalid.' });
    }

    const token = tokenParts[1];
    console.log('[AUTH] Token extracted successfully.'); // Don't log the token itself for security

    try {
        if (!process.env.JWT_SECRET) {
            console.error('[AUTH FATAL ERROR] JWT_SECRET is not defined in .env file on the server!');
            // This is a server configuration error, so send 500
            return res.status(500).json({ msg: 'Server configuration error (JWT Secret missing).' });
        }
        console.log('[AUTH] JWT_SECRET is present.');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[AUTH] Token decoded successfully. Payload:', decoded);

        // ****** IMPORTANT: Adjust 'decoded.id' if your payload uses a different key for user ID ******
        if (!decoded.id && !decoded.userId) { // Check for common 'id' or 'userId'
             console.log('[AUTH ERROR] Decoded token does not contain user ID (checked for "id" and "userId"). Payload was:', decoded, '. Sending 401 JSON.');
             return res.status(401).json({ msg: 'Token invalid (missing user ID in payload).' });
        }
        // Prioritize 'id', then 'userId'
        req.userId = decoded.id || decoded.userId;
        console.log(`[AUTH] userId set on request: ${req.userId}`);

        console.log('--- [AUTH MIDDLEWARE SUCCESS & CALLING NEXT()] ---');
        next();
    } catch (err) {
        console.error('[AUTH CATCH BLOCK ERROR] Token verification failed or other error:', err.name, '-', err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token is not valid (JsonWebTokenError).', detail: err.message });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token is expired.', detail: err.message });
        }
        // For any other errors caught here
        return res.status(500).json({ msg: 'Server error during authentication.', errorDetail: err.message });
    }
};