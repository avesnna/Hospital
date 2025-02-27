const authMiddleware = (req, res, next) => {
    console.log('Auth middleware called. Session:', req.session);
    if (req.session && req.session.user) {
        req.user = req.session.user;
        console.log('User found:', req.user);

        const Id = req.user.id;
        console.log('User ID from session:', Id);

        res.locals.role = req.user.role;

        if (req.user.role === 'specialist') {
            const departmentId = req.user.departmentId;

            if (!departmentId) {
                console.warn('Department ID is undefined');
            }
        }
        return next();
    }

    console.warn('Unauthorized access attempt');
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: no user found',
    });
};

module.exports = authMiddleware;