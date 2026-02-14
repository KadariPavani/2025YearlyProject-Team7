const express = require("express");
const router = express.Router();
const { createContact, getAllContacts, deleteContact } = require("../controllers/contactController");
const { verifyAdmin } = require("../middleware/auth");

router.post("/contact", createContact);
router.get("/contacts", verifyAdmin, getAllContacts);
router.delete("/contacts/:id", verifyAdmin, deleteContact);

module.exports = router;
