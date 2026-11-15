/**
 * WaaS API Authentication Middleware
 * Supports environment-based tokens, constant-time verification, and role resolution.
 */

const crypto = require('crypto');

const PROVISIONED_TOKENS = (process.env.WAAS_API_TOKENS || 'waas_demo_token_2026,alx_savanna_tenant_key_2026')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean);

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  const token = req.headers['x-waas-token'] || req.headers['x-lumo-key'] || (
    req.headers['authorization'] ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : null
  );

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      code: 'MISSING_TOKEN',
      message: 'Authentication required. Please provide X-Waas-Token or X-Lumo-Key header.'
    });
  }

  const isValid = PROVISIONED_TOKENS.some(validToken => safeCompare(token, validToken));
  if (!isValid) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code: 'INVALID_TOKEN',
      message: 'The provided authentication token is invalid or expired.'
    });
  }

  req.user = { role: 'operator', token };
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers['x-waas-token'] || req.headers['x-lumo-key'];
  if (token) {
    const isValid = PROVISIONED_TOKENS.some(validToken => safeCompare(token, validToken));
    if (isValid) {
      req.user = { role: 'operator', token };
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
