const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Your account has been deactivated by administrator. Please contact admissions support.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions ? JSON.parse(user.permissions) : {}
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${roles.join(', ')}] role.`
      });
    }

    next();
  };
}

function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Admins always bypass granular permission locks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions[permissionKey]) {
      return res.status(403).json({
        error: `Action restricted. Your account lacks the '${permissionKey}' permission. Contact administrator.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission
};
