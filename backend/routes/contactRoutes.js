const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/contact", async (req, res) => {
  try {
    console.log("CONTACT API HIT ✅");
    console.log("BODY 👉", req.body);

    const { name, email, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and Phone are required",
      });
    }

    const contact = new Contact({
      name,
      email,
      phone,
    });

    await contact.save();

    return res.status(201).json({
      message: "Saved successfully",
    });
  } catch (error) {
    console.error("CONTACT ERROR 👉", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
