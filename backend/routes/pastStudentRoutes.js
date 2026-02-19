const express = require('express');
const router = express.Router();
const pastStudentAuth = require('../middleware/pastStudentAuth');
const {
  pastStudentLogin,
  getProfile,
  updateProfile,
  getPlacement,
  updatePlacement,
  changePassword,
  uploadProfileImage
} = require('../controllers/pastStudentController');

// Public
router.post('/login', pastStudentLogin);

// Protected (requires past_student JWT)
router.get('/profile', pastStudentAuth, getProfile);
router.put('/profile', pastStudentAuth, updateProfile);
router.get('/placement', pastStudentAuth, getPlacement);
router.put('/placement', pastStudentAuth, updatePlacement);
router.put('/change-password', pastStudentAuth, changePassword);
router.post('/profile-image', pastStudentAuth, uploadProfileImage);

module.exports = router;
