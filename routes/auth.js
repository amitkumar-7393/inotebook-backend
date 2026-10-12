const express = require("express");

const User = require("../models/User");

const router = express.Router();

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

//ROUTER 1: create a user using: POST "/api/auth". doesn't require Auth

router.post(
  "/",
  [
    // Validate name - minimum 3 characters
    body("name", "Enter a valid name").isLength({ min: 3 }),

    // Validate email - must be a valid email
    body("email", "Enter a valid email").isEmail(),

    // Validate password - minimum 5 characters
    body("password", "Password must  be at least 5 characters").isLength({
      min: 5,
    }),
  ],

  // async is used because we are using await below
  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);

    // If there are validation errors, send them to the client
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if a user with this email already exists
      let user = await User.findOne({ email: req.body.email });

      // If user already exists, return an error
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this email already exists" });
      }

      // Generate a salt for password hashing
      const salt = await bcrypt.genSalt(10);

      // Hash the user's password
      const secPass = await bcrypt.hash(req.body.password, salt);

      // Create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      const data = {
        id: user.id,
      };

      const authtoken = jwt.sign(data, JWT_SECRET);

      // Send the created user as response
      res.json({ authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server Error");
    }
  },
);

//ROUTER 2: Authenticate a User Using: POST "/api/auth/login". No login required

router.post(
  "/login",
  [
    // Validate email - must be a valid email
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);

    // If there are validation errors, send them to the client
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "please try to login with correct credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "please try to login with correct credentials" });
      }

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);
      res.json({ authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server Error");
    }
  },
);

//ROUTER 3: Get logged in User Details using: POST "/api/auth/getuser". Login required

router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
});
module.exports = router;
