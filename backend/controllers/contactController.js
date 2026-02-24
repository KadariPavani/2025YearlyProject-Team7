const Contact = require("../models/Contact");
const { notifyAdminNewContact } = require("./notificationController");

const createContact = async (req, res) => {
  try {

    const { name, email, phone, message } = req.body;

    if (!name || !phone) {
      return res.status(200).json({
        message: "Name and Phone are required",
      });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      message: message || "",
    });

    await contact.save();

    try {
      await notifyAdminNewContact({ name, email, phone, message });
    } catch (e) {
    }

    return res.status(201).json({
      message: "Saved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(200).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createContact,
  getAllContacts,
  deleteContact,
};
