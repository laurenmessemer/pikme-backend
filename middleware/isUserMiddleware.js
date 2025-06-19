const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * API validation for the User
 * @author Dhrumil Amrutiya (Zignuts)
 */
const isUserMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: 'No token, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res
        .status(401)
        .json({ message: "Invalid token format. Expected 'Bearer <token>'" });
    }

    const decoded = jwt.verify(tokenParts[1], process.env.JWT_SECRET);

    if (!decoded || decoded.role !== 'participant') {
      return res
        .status(403)
        .json({ message: 'Invalid or missing role in token.' });
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid token. User not found.' });
    }

    // api path
    let apiPath = req.baseUrl + req.route.path;

    // ban user can have access of this two apis only
    const accessForBanUser = ['/api/contact', '/api/auth/me'];

    // restrict the bat user to access the apis
    if (user.status === 'Ban' && !accessForBanUser.includes(apiPath)) {
      return res.status(401).json({ message: 'User do not have access!' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error('❌ Auth Middleware Error:', err.message);
    return res
      .status(401)
      .json({ message: 'Token is not valid', error: err.message });
  }
};

module.exports = isUserMiddleware;
