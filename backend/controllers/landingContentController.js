const LandingContent = require('../models/LandingContent');
const cloudinary = require('../config/cloudinary');

// ────────────────── Public ──────────────────

// GET /api/public/landing-content
const getPublicLandingContent = async (req, res) => {
  try {
    const doc = await LandingContent.getOrCreate();

    const heroSlides = doc.heroSlides
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order);

    const faqs = doc.faqs
      .filter(f => f.isActive)
      .sort((a, b) => a.order - b.order);

    res.json({ success: true, data: { heroSlides, faqs } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────── Admin GET ──────────────────

// GET /api/admin/landing-content
const getAdminLandingContent = async (req, res) => {
  try {
    const doc = await LandingContent.getOrCreate();
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────── Hero Slides CRUD ──────────────────

const addHeroSlide = async (req, res) => {
  try {
    const { title, description, buttonText, buttonUrl, order, isActive } = req.body;
    if (!title || !description) {
      return res.status(200).json({ success: false, message: 'Title and description are required' });
    }
    if (!req.file) {
      return res.status(200).json({ success: false, message: 'Image is required' });
    }

    const doc = await LandingContent.getOrCreate();
    doc.heroSlides.push({
      title,
      description,
      buttonText: buttonText || '',
      buttonUrl: buttonUrl || '',
      imageUrl: req.file.path,
      imagePublicId: req.file.filename,
      order: order ?? doc.heroSlides.length,
      isActive: isActive !== undefined ? isActive : true
    });
    await doc.save();

    res.status(201).json({ success: true, data: doc.heroSlides[doc.heroSlides.length - 1] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, buttonText, buttonUrl, order, isActive } = req.body;

    const doc = await LandingContent.getOrCreate();
    const slide = doc.heroSlides.id(id);
    if (!slide) return res.status(200).json({ success: false, message: 'Slide not found' });

    if (title !== undefined) slide.title = title;
    if (description !== undefined) slide.description = description;
    if (buttonText !== undefined) slide.buttonText = buttonText;
    if (buttonUrl !== undefined) slide.buttonUrl = buttonUrl;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    // If a new image was uploaded, delete old one from Cloudinary
    if (req.file) {
      if (slide.imagePublicId) {
        try { await cloudinary.uploader.destroy(slide.imagePublicId); } catch (e) {}
      }
      slide.imageUrl = req.file.path;
      slide.imagePublicId = req.file.filename;
    }

    await doc.save();
    res.json({ success: true, data: slide });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LandingContent.getOrCreate();
    const slide = doc.heroSlides.id(id);
    if (!slide) return res.status(200).json({ success: false, message: 'Slide not found' });

    // Delete image from Cloudinary
    if (slide.imagePublicId) {
      try { await cloudinary.uploader.destroy(slide.imagePublicId); } catch (e) {}
    }

    doc.heroSlides.pull(id);
    await doc.save();
    res.json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────── FAQs CRUD ──────────────────

const addFAQ = async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;
    if (!question || !answer) {
      return res.status(200).json({ success: false, message: 'Question and answer are required' });
    }

    const doc = await LandingContent.getOrCreate();
    doc.faqs.push({
      question,
      answer,
      order: order ?? doc.faqs.length,
      isActive: isActive !== undefined ? isActive : true
    });
    await doc.save();

    res.status(201).json({ success: true, data: doc.faqs[doc.faqs.length - 1] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, order, isActive } = req.body;

    const doc = await LandingContent.getOrCreate();
    const faq = doc.faqs.id(id);
    if (!faq) return res.status(200).json({ success: false, message: 'FAQ not found' });

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (order !== undefined) faq.order = order;
    if (isActive !== undefined) faq.isActive = isActive;

    await doc.save();
    res.json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LandingContent.getOrCreate();
    const faq = doc.faqs.id(id);
    if (!faq) return res.status(200).json({ success: false, message: 'FAQ not found' });

    doc.faqs.pull(id);
    await doc.save();
    res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPublicLandingContent,
  getAdminLandingContent,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  addFAQ,
  updateFAQ,
  deleteFAQ
};
