// Role-based access control middleware

// Only co-founders can access
export const isCofounder = (req, res, next) => {
    if (req.user && req.user.role === 'cofounder') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied - Co-founder privileges required"
    });
};

// Co-founders and core team can access
export const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'cofounder' || req.user.role === 'core')) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied - Admin privileges required"
    });
};

// Allow all authenticated users
export const isMember = (req, res, next) => {
    if (req.user) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Authentication required"
    });
};

// Check specific roles
export const hasRole = (...roles) => {
    return (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied - Required role: ${roles.join(' or ')}`
        });
    };
};

export default { isCofounder, isAdmin, isMember, hasRole };
