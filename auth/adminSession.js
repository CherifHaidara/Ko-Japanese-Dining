const crypto = require('crypto');

const ADMIN_SESSION_ID = crypto.randomUUID
  ? crypto.randomUUID()
  : crypto.randomBytes(16).toString('hex');

function buildAdminTokenClaims(claims = {}) {
  return {
    ...claims,
    role: 'admin',
    admin_session_id: ADMIN_SESSION_ID,
  };
}

function isCurrentAdminSession(decodedToken) {
  return decodedToken?.role === 'admin' && decodedToken?.admin_session_id === ADMIN_SESSION_ID;
}

module.exports = {
  ADMIN_SESSION_ID,
  buildAdminTokenClaims,
  isCurrentAdminSession,
};
