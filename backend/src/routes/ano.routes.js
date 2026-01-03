const express = require("express");
const {
  addCadet,
  getCadets,
  updateCadet,
  deleteCadet,
  searchCadets,
} = require("../controllers/ano.controller");

const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Add Cadet (Generate Credentials)
router.post("/cadets", authenticate, addCadet);

// Get All Cadets (ANO's College)
router.get("/cadets", authenticate, getCadets);

// Update Cadet
router.put("/cadets/:regimental_no", authenticate, updateCadet);

// Delete Cadet
router.delete("/cadets/:regimental_no", authenticate, deleteCadet);

// Search Cadets
router.get("/cadets/search", authenticate, searchCadets);

module.exports = router;
