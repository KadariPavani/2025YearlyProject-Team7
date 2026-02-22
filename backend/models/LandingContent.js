const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  buttonText: { type: String, default: '', trim: true },
  buttonUrl: { type: String, default: '', trim: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String }, // Cloudinary public_id for deletion
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const landingContentSchema = new mongoose.Schema({
  _id: { type: String, default: 'landing-content' },
  heroSlides: [heroSlideSchema],
  faqs: [faqSchema]
}, { timestamps: true });

// Ensure the singleton document exists
landingContentSchema.statics.getOrCreate = async function () {
  let doc = await this.findById('landing-content');
  if (!doc) {
    doc = await this.create({
      _id: 'landing-content',
      heroSlides: [],
      faqs: []
    });
  }
  return doc;
};

module.exports = mongoose.model('LandingContent', landingContentSchema);
