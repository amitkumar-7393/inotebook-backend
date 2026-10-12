const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    return res.status(401).json({
      error: "Please login first.",
    });
  }

  if (!JWT_SECRET) {
    console.error("JWT_SECRET environment variable is missing");
    return res.status(500).json({
      error: "Server configuration error",
    });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);

    // Support both Signup and Login token formats
    req.user = data.user || { id: data.id };

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Invalid token. Please login again.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token. Please login again.",
    });
  }
};

module.exports = fetchuser;
