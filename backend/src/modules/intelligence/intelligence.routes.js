// Responsibility: Route definitions for the Intelligence Layer (/api/intel).
// Layer: Intelligence (Layer 1) routes.
// Depends on: existing auth.middleware (authenticate) + authorize.middleware (authorizeRole),
//   and intelligence.controller.
// Must never be depended on by: any existing/legacy module.
// Mounted additively in app.js as app.use("/api/intel", ...). SUO is role CADET,
// so authorizeRole("CADET") covers SUO; per-record ownership/college scope is
// enforced in the controller.

const express = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const { authorizeRole } = require("../../middlewares/authorize.middleware");
const controller = require("./intelligence.controller");

const router = express.Router();

router.use(authenticate);

router.get(
  "/cadet/:regimentalNo",
  authorizeRole("ANO", "CADET", "ALUMNI"),
  controller.getCadetReadiness
);

router.post(
  "/recompute",
  authorizeRole("ANO", "CADET", "ALUMNI"),
  controller.recompute
);

module.exports = router;
