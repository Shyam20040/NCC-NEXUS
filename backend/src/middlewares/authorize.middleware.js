const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

const authorizeDesignation = (...allowedDesignations) => {
  return (req, res, next) => {
    if (!allowedDesignations.includes(req.user.designation)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = {
  authorizeRole,
  authorizeDesignation,
};
