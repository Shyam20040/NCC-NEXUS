const express = require("express");
const {
  anoLogin,
  cadetLogin,
  resetPasswordLoggedIn,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/ano/login", anoLogin);
router.post("/cadet/login", cadetLogin);
router.post("/reset-password", authenticate, resetPasswordLoggedIn);

module.exports = router;
