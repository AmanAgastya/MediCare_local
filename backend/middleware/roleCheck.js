const jwt = require('jsonwebtoken');

// Accepts a single role string OR an array of roles
// e.g. roleCheck('admin')  or  roleCheck(['admin','super_admin'])
module.exports = (role) => {
  const allowed = Array.isArray(role) ? role : [role, 'super_admin'];

  return (req, res, next) => {
    // Support both  Authorization: Bearer <token>  AND  x-auth-token: <token>
    let token = req.header('x-auth-token');
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;

      if (!req.user || !allowed.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient role' });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};