const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
const { profileUpload } = require('../middleware/fileUpload');

// @desc   Past student login by roll number
// @route  POST /api/past-student/login
// @access Public
const pastStudentLogin = async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    if (!rollNo || !password) {
      return res.status(400).json({ success: false, message: 'Roll number and password are required' });
    }

    const normalizedRollNo = String(rollNo).trim().toUpperCase();

    // ── FIX 1: Case-insensitive rollNo lookup ─────────────────────────────────
    // Students created via TPO "Add Student" or batch Excel have rollNo stored in
    // whatever case was entered (e.g. "21001a0501" or "21001A0501").
    // We escape the rollNo to avoid regex injection, then search case-insensitively.
    const escapedRollNo = normalizedRollNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const student = await Student.findOne({
      rollNo: { $regex: new RegExp(`^${escapedRollNo}$`, 'i') }
    }).select('+password');

    if (!student) {
      return res.status(401).json({ success: false, message: 'Student not found with this roll number' });
    }

    // ── Standard bcrypt comparison ────────────────────────────────────────────
    // Guard: imported students have a plain-text random password stored (insertMany
    // skips the pre-save hash hook). bcryptjs throws "Invalid hash provided" when
    // the stored value is not a valid bcrypt hash ($2b$ / $2a$ prefix).
    // Skip the compare entirely for those students to avoid a 500 crash.
    const storedIsBcrypt = student.password && student.password.startsWith('$2');
    let isMatch = storedIsBcrypt
      ? await bcrypt.compare(password, student.password)
      : false;

    if (!isMatch) {
      // ── FIX 2a: Student has a plain-text (non-bcrypt) password ───────────────
      // This can ONLY happen for students created via insertMany (past placement
      // Excel import), which skips the mongoose pre-save hash hook.  The stored
      // password is a random string the student was never told.
      // Accept login when the entered password matches the rollNo (the advertised
      // default), then hash and persist the rollNo as the real password.
      // Uses findByIdAndUpdate to bypass validators & the pre-save hook.
      if (!storedIsBcrypt) {
        if (password.toUpperCase() === student.rollNo.toUpperCase()) {
          const hashed = await bcrypt.hash(normalizedRollNo, 10);
          await Student.findByIdAndUpdate(student._id, {
            $set: { password: hashed, passwordChanged: false }
          });
          isMatch = true;
        }

      // ── FIX 2b: Default-password students with case mismatch ───────────────
      // Students created via TPO "Add Student" have password = bcrypt(original rollNo).
      // If the user types the rollNo in a different case as their password, bcrypt
      // will fail. We only fall through when:
      //   a) the student has not yet changed their default password
      //   b) the entered password matches the student's stored rollNo case-insensitively
      //   c) the stored hash was indeed generated from the stored rollNo (confirming
      //      the stored password IS the default rollNo-based password)
      } else if (!student.passwordChanged) {
        const enteredMatchesRollNo =
          password.toUpperCase() === student.rollNo.toUpperCase();

        if (enteredMatchesRollNo) {
          const storedIsRollNo = await bcrypt.compare(student.rollNo, student.password);
          if (storedIsRollNo) {
            // Normalize password to uppercase rollNo for consistent future logins
            const hashed = await bcrypt.hash(normalizedRollNo, 10);
            await Student.findByIdAndUpdate(student._id, {
              $set: { password: hashed }
            });
            isMatch = true;
          }
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = generateToken({
      id: student._id,
      rollNo: student.rollNo,
      userType: 'past_student'
    });

    return res.json({
      success: true,
      token,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        college: student.college,
        branch: student.branch,
        yearOfPassing: student.yearOfPassing,
        email: student.email,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error('Past student login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get past student profile
// @route  GET /api/past-student/profile
// @access Past Student (JWT)
const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.studentId).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get past student profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Update past student profile
// @route  PUT /api/past-student/profile
// @access Past Student (JWT)
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phonenumber', 'email', 'profileImageUrl',
      'bio', 'gender', 'dob', 'currentLocation', 'hometown', 'socialLinks'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Don't allow overwriting real email with placeholder
    if (updates.email && updates.email.includes('imported.placeholder')) {
      delete updates.email;
    }

    const student = await Student.findByIdAndUpdate(
      req.studentId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    return res.json({ success: true, message: 'Profile updated successfully', data: student });
  } catch (error) {
    console.error('Update past student profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get past student placement details
// @route  GET /api/past-student/placement
// @access Past Student (JWT)
const getPlacement = async (req, res) => {
  try {
    const student = await Student.findById(req.studentId).select(
      'name rollNo college branch yearOfPassing status placementDetails allOffers'
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get placement error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Add or update placement record
// @route  PUT /api/past-student/placement
// @access Past Student (JWT)
const updatePlacement = async (req, res) => {
  try {
    const { company, role, package: pkg, addNew, offerId } = req.body;

    if (!company || !role || pkg === undefined) {
      return res.status(400).json({ success: false, message: 'Company, role, and package are required' });
    }

    const ctc = parseFloat(pkg);
    if (isNaN(ctc) || ctc < 0) {
      return res.status(400).json({ success: false, message: 'Invalid package value' });
    }

    const student = await Student.findById(req.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.allOffers = student.allOffers || [];

    if (addNew) {
      // Add new offer entry
      student.allOffers.push({
        company: company.trim(),
        role: role.trim(),
        package: ctc,
        offeredDate: new Date()
      });
    } else if (offerId) {
      // Edit an existing offer by its _id
      const offer = student.allOffers.id(offerId);
      if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
      offer.company = company.trim();
      offer.role = role.trim();
      offer.package = ctc;
    } else {
      // Update the primary placementDetails directly
      student.placementDetails = {
        ...student.placementDetails,
        company: company.trim(),
        role: role.trim(),
        package: ctc
      };
    }

    // Keep placementDetails in sync with the highest offer
    if (student.allOffers.length > 0) {
      const highest = student.allOffers.reduce((max, o) => o.package > max.package ? o : max, student.allOffers[0]);
      if (!student.placementDetails?.package || highest.package >= student.placementDetails.package) {
        student.placementDetails = {
          company: highest.company,
          role: highest.role,
          package: highest.package,
          placedDate: student.placementDetails?.placedDate || new Date()
        };
      }
    }

    student.status = 'placed';
    await student.save();

    return res.json({
      success: true,
      message: 'Placement updated successfully',
      data: {
        placementDetails: student.placementDetails,
        allOffers: student.allOffers,
        status: student.status
      }
    });
  } catch (error) {
    console.error('Update placement error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Change password
// @route  PUT /api/past-student/change-password
// @access Past Student (JWT)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const student = await Student.findById(req.studentId).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    student.password = newPassword;
    student.passwordChanged = true;
    await student.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Upload past student profile image to Cloudinary
// @route  POST /api/past-student/profile-image
// @access Past Student (JWT)
const uploadProfileImage = (req, res) => {
  profileUpload(req, res, async (err) => {
    if (err) {
      console.error('Past student profile upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const updated = await Student.findByIdAndUpdate(
        req.studentId,
        { profileImageUrl: req.file.path },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      return res.json({ success: true, data: updated.profileImageUrl, message: 'Profile image uploaded successfully' });
    } catch (error) {
      console.error('Error saving profile image:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload profile image' });
    }
  });
};

module.exports = {
  pastStudentLogin,
  getProfile,
  updateProfile,
  getPlacement,
  updatePlacement,
  changePassword,
  uploadProfileImage
};
