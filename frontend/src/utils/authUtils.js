// All localStorage keys used for auth across roles
const LOCAL_AUTH_KEYS = [
  'token',
  'userType',
  'userToken',
  'userData',
  'adminToken',
  'adminData',
  'trainerToken',
  'trainerData',
  'coordinatorToken',
  'coordinatorData',
  'pastStudentToken',
  'pastStudentData',
];

// sessionStorage keys used for auth flows
const SESSION_AUTH_KEYS = [
  'adminEmail',
  'otpSentAt',
];

/**
 * Remove all auth-related localStorage and sessionStorage keys.
 * Call this before setting new tokens on login, and on logout.
 */
export function clearAllAuthTokens() {
  LOCAL_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  SESSION_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Decode a JWT and check whether it has expired.
 * Returns true if the token is expired or cannot be decoded.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false; // no expiry claim — treat as valid
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
