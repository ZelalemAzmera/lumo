/**
 * Simple token-based auth middleware for WaaS API.
 * Checks X-Waas-Token header. For demo, accepts 'waas_demo_token_2026'.
 */

const DEMO_TOKEN = 'waas_demo_token_2026';

function authMiddleware(req, res, next) {
  const token = req.headers['x-waas-token'];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide an X-Waas-Token header'
    });
  }

  if (token !== DEMO_TOKEN) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid authentication token'
    });
  }

  req.user = { role: 'demo', token };
  next();
}

module.exports = { authMiddleware, DEMO_TOKEN };
