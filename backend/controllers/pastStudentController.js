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
      return res.status(200).json({ success: false, message: 'Roll number and password are required' });
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
      return res.status(200).json({ success: false, message: 'Student not found with this roll number' });
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
      return res.status(200).json({ success: false, message: 'Invalid password' });
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get past student profile
// @route  GET /api/past-student/profile
// @access Past Student (JWT)
const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.studentId).select('-password');
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });
    return res.json({ success: true, data: student });
  } catch (error) {
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

    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    return res.json({ success: true, message: 'Profile updated successfully', data: student });
  } catch (error) {
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
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });
    return res.json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Add or update placement record
// @route  PUT /api/past-student/placement
// @access Past Student (JWT)
const updatePlacement = async (req, res) => {
  try {
    const { company, role, package: pkg, type: offerType, duration, stipend, addNew, offerId } = req.body;

    const type = offerType || 'PLACEMENT';

    // Validate type
    if (!['PLACEMENT', 'INTERNSHIP', 'TRAINING'].includes(type)) {
      return res.status(200).json({ success: false, message: 'Type must be PLACEMENT, INTERNSHIP, or TRAINING' });
    }

    if (!company || !role) {
      return res.status(200).json({ success: false, message: 'Company and role are required' });
    }

    // Validate compensation based on type
    if (type === 'PLACEMENT') {
      if (pkg === undefined || pkg === null || pkg === '') {
        return res.status(200).json({ success: false, message: 'Package (LPA) is required for PLACEMENT type' });
      }
      const ctc = parseFloat(pkg);
      if (isNaN(ctc) || ctc < 0) {
        return res.status(200).json({ success: false, message: 'Invalid package value' });
      }
    } else {
      if (stipend === undefined || stipend === null || stipend === '') {
        return res.status(200).json({ success: false, message: 'Stipend (K/month) is required for INTERNSHIP/TRAINING type' });
      }
      const stip = parseFloat(stipend);
      if (isNaN(stip) || stip < 0) {
        return res.status(200).json({ success: false, message: 'Invalid stipend value' });
      }
    }

    const ctc = type === 'PLACEMENT' ? parseFloat(pkg) : 0;
    const stip = type !== 'PLACEMENT' ? parseFloat(stipend) : 0;
    const dur = type === 'PLACEMENT' ? 'FULL TIME' : (duration || '6');

    const student = await Student.findById(req.studentId);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    student.allOffers = student.allOffers || [];

    const offerData = {
      company: company.trim(),
      role: role.trim(),
      package: ctc,
      type,
      duration: dur,
      stipend: stip,
      offeredDate: new Date()
    };

    if (addNew) {
      student.allOffers.push(offerData);
    } else if (offerId) {
      const offer = student.allOffers.id(offerId);
      if (!offer) return res.status(200).json({ success: false, message: 'Offer not found' });
      offer.company = company.trim();
      offer.role = role.trim();
      offer.package = ctc;
      offer.type = type;
      offer.duration = dur;
      offer.stipend = stip;
    } else {
      student.placementDetails = {
        ...student.placementDetails,
        company: company.trim(),
        role: role.trim(),
        package: ctc,
        type,
        duration: dur,
        stipend: stip
      };
    }

    // Keep placementDetails in sync with the highest-ranked offer
    // Type-aware ranking: PLACEMENT > TRAINING > INTERNSHIP, then by compensation
    if (student.allOffers.length > 0) {
      const typeRank = { PLACEMENT: 3, TRAINING: 2, INTERNSHIP: 1 };
      const highest = student.allOffers.reduce((max, o) => {
        const maxRank = typeRank[max.type] || 0;
        const oRank = typeRank[o.type] || 0;
        if (oRank > maxRank) return o;
        if (oRank < maxRank) return max;
        const maxComp = max.type === 'PLACEMENT' ? (max.package || 0) : (max.stipend || 0);
        const oComp = o.type === 'PLACEMENT' ? (o.package || 0) : (o.stipend || 0);
        return oComp > maxComp ? o : max;
      }, student.allOffers[0]);

      student.placementDetails = {
        company: highest.company,
        role: highest.role,
        package: highest.package || 0,
        type: highest.type || 'PLACEMENT',
        duration: highest.duration || 'FULL TIME',
        stipend: highest.stipend || 0,
        placedDate: student.placementDetails?.placedDate || new Date()
      };
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
      return res.status(200).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(200).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const student = await Student.findById(req.studentId).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) return res.status(200).json({ success: false, message: 'Current password is incorrect' });

    student.password = newPassword;
    student.passwordChanged = true;
    await student.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Upload past student profile image to Cloudinary
// @route  POST /api/past-student/profile-image
// @access Past Student (JWT)
const uploadProfileImage = (req, res) => {
  profileUpload(req, res, async (err) => {
    if (err) {
      return res.status(200).json({ success: false, message: err.message });
    }
    try {
      if (!req.file) {
        return res.status(200).json({ success: false, message: 'No file uploaded' });
      }

      const updated = await Student.findByIdAndUpdate(
        req.studentId,
        { profileImageUrl: req.file.path },
        { new: true }
      );

      if (!updated) {
        return res.status(200).json({ success: false, message: 'Student not found' });
      }

      return res.json({ success: true, data: updated.profileImageUrl, message: 'Profile image uploaded successfully' });
    } catch (error) {
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
