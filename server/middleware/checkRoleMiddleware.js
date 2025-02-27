const checkRoleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        console.log('Checking user role...', req.user);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: no user found'
            });
        }

        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: insufficient permissions'
            });
        }
    };
};

module.exports = checkRoleMiddleware;