// src/components/student/StudentProfile.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Upload,
  Pencil,
  Code2,
  Briefcase,
  Award,
  Building2,
  MapPin,
  Star,
  ExternalLink,
  Download,
  Eye,
} from "lucide-react";
import {
  getProfile,
  updateProfile,
  checkPasswordChange,
} from "../../services/generalAuthService";
import axios from "axios";
import ToastNotification from "../../components/ui/ToastNotification";
import Header from "../../components/common/Header";

const backendURL = 'http://localhost:5000';

const emptyProject = {
  title: "",
  techStack: [],
  description: "",
  links: {},
  startDate: "",
  endDate: "",
  verificationStatus: "pending",
};

const emptyInternship = {
  company: "",
  role: "",
  location: "",
  experience: "",
  techStack: [],
  startDate: "",
  endDate: "",
  verificationStatus: "pending",
};

const emptyAppreciation = { title: "", description: "", dateReceived: "", givenBy: "" };

const emptyCertification = {
  name: "",
  issuer: "",
  credentialId: "",
  dateIssued: "",
  expiryDate: "",
  imageUrl: "",
  verificationStatus: "pending",
};

const emptySocialLink = { platform: "", url: "" };

const isEmptyProject = (p) =>
  !p.title &&
  (!p.techStack || p.techStack.length === 0) &&
  !p.description &&
  (!p.links || (!p.links.github && !p.links.live && !p.links.demo)) &&
  !p.startDate &&
  !p.endDate;

const isEmptyInternship = (i) =>
  !i.company &&
  !i.role &&
  !i.location &&
  !i.experience &&
  (!i.techStack || i.techStack.length === 0) &&
  !i.startDate &&
  !i.endDate;

const isEmptyAppreciation = (a) =>
  !a.title && !a.description && !a.dateReceived && !a.givenBy;

const isEmptyCertification = (c) =>
  !c.name &&
  !c.issuer &&
  !c.credentialId &&
  !c.dateIssued &&
  !c.expiryDate &&
  !c.imageUrl;

const isEmptySocialLink = (s) => !s.platform && !s.url;

const StudentProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [selectedEducationType, setSelectedEducationType] = useState("inter");
  const [selectedCRTBatch, setSelectedCRTBatch] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [availableCRTOptions, setAvailableCRTOptions] = useState([]);
  const [availableTechStacks, setAvailableTechStacks] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showResumeOptions, setShowResumeOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const resumeMenuRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    const fetchAvailableTechStacks = async () => {
      try {
        const response = await axios.get('/api/student/available-crt-options');
        if (response.data.success) {
          setAvailableTechStacks(response.data.data.batchAllowedTechStacks);
        }
      } catch (error) {
        console.error('Error fetching tech stacks:', error);
      }
    };

    fetchAvailableTechStacks();
  }, []);

  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (resumeMenuRef.current && !resumeMenuRef.current.contains(event.target)) {
      setShowResumeOptions(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setProfile(result.data);
        setFormData(result.data);
        setSelectedEducationType(result.data.academics?.educationType || "inter");
        setSelectedCRTBatch(result.data.crtBatchChoice || "");
        setAvailableCRTOptions(result.data.availableCRTOptions || ['NonCRT']);

        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          ...result.data
        }));
      } else {
        setError(result.message || "Failed to fetch profile");
        if (response.status === 401) {
          localStorage.removeItem("userToken");
          localStorage.removeItem("userData");
          navigate("/student-login");
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const checkPasswordStatus = async () => {
    try {
      const response = await checkPasswordChange("student");
      if (response.data.success) {
        setNeedsPasswordChange(response.data.needsPasswordChange);
      }
    } catch {}
  };

  const handleEducationTypeChange = (e) => {
    const eduType = e.target.value;
    setSelectedEducationType(eduType);
    setFormData((prev) => ({
      ...prev,
      academics: {
        ...prev.academics,
        educationType: eduType,
        ...(eduType === "inter" ? { diploma: {} } : { inter: {} }),
      },
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        const copy = { ...prev };
        let temp = copy;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!temp[keys[i]]) temp[keys[i]] = {};
          temp = temp[keys[i]];
        }
        temp[keys[keys.length - 1]] = value;
        return copy;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const uploadProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);
    setUploadingImage(true);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${backendURL}/api/student/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          profileImageUrl: data.data
        }));
        setSuccess('Profile image uploaded successfully');
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.message || 'Error uploading profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    setUploadingResume(true);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${backendURL}/api/student/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          resumeUrl: data.data.url,
          resumeFileName: data.data.fileName
        }));
        setSuccess('Resume uploaded successfully');
      } else {
        throw new Error(data.message || 'Failed to upload resume');
      }
    } catch (err) {
      setError(err.message || 'Error uploading resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleCRTBatchChoiceChange = (e) => {
    const newBatch = e.target.value;

    if (newBatch !== profile.crtBatchChoice && profile.crtBatchChoice) {
      const confirmChange = window.confirm(
        'Changing CRT batch requires TPO approval. Do you want to continue?'
      );
      if (!confirmChange) {
        e.target.value = selectedCRTBatch;
        return;
      }
    }

    setSelectedCRTBatch(newBatch);
    setFormData((prev) => ({
      ...prev,
      crtBatchChoice: newBatch,
      techStack: availableTechStacks.includes(newBatch) ? [newBatch] : prev.techStack
    }));
  };

  const handleCRTInterestChange = (e) => {
    const interested = e.target.value === "yes";

    if (interested !== profile.crtInterested) {
      const confirmChange = window.confirm(
        'Changing CRT status requires TPO approval. Do you want to continue?'
      );
      if (!confirmChange) {
        e.preventDefault();
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      crtInterested: interested,
      crtBatchChoice: interested ? prev.crtBatchChoice : ""
    }));

    if (!interested) {
      setSelectedCRTBatch("");
    }
  };

  const handleTechStackChange = (tech) => {
    setFormData((prev) => {
      const currentTechStack = prev.techStack || [];
      return {
        ...prev,
        techStack: currentTechStack.includes(tech)
          ? currentTechStack.filter(t => t !== tech)
          : [...currentTechStack, tech]
      };
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('userToken');
      const student = profile;

      const crtStatusChanged = formData.crtInterested !== undefined && 
                             formData.crtInterested !== student.crtInterested;
      const crtBatchChanged = formData.crtBatchChoice !== undefined && 
                            formData.crtBatchChoice !== student.crtBatchChoice;

      const hasChangesRequiringApproval = crtStatusChanged || crtBatchChanged;

      if (hasChangesRequiringApproval && isEditing) {
        const confirmed = window.confirm(
          'Your CRT-related changes will be sent to TPO for approval. Do you want to continue?'
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }

      const dataToSend = {
        ...formData,
        ...(crtStatusChanged ? { crtInterested: formData.crtInterested } : {}),
        ...(crtBatchChanged ? { crtBatchChoice: formData.crtBatchChoice } : {})
      };

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProfile(result.data);
        setFormData(result.data);
        setIsEditing(false);

        if (result.requiresApproval) {
          setSuccess('Profile updated. Changes requiring approval have been sent to TPO for review.');
          await fetchPendingApprovals();
        } else {
          setSuccess('Profile updated successfully!');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (result.hasPendingApproval) {
          setError('You already have a pending approval request. Please wait for TPO review.');
        } else {
          setError(result.message || 'Failed to update profile');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('An error occurred while saving the profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ApprovalStatusBanner = () => {
    if (!pendingApprovals || pendingApprovals.totalPending === 0) return null;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You have {pendingApprovals.totalPending} pending approval request{pendingApprovals.totalPending !== 1 ? 's' : ''}.
              Your changes will be reviewed by the TPO.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const RejectedApprovalsBanner = () => {
    const rejectedApprovals = pendingApprovals?.rejected || [];
    if (rejectedApprovals.length === 0) return null;

    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            {rejectedApprovals.map((approval, index) => (
              <p key={index} className="text-sm text-red-700">
                Your request was rejected: {approval.rejectionReason}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError("");
    setSelectedCRTBatch(profile.crtBatchChoice || "");
  };

  const addItemToArray = (field, defaultValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] ? [...prev[field], defaultValue] : [defaultValue],
    }));
  };

  const removeItemFromArray = (field, idx) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const updateItemInArray = (field, idx, key, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === idx ? { ...item, [key]: val } : item
      ),
    }));
  };

  const updateLinkInArray = (field, idx, linkKey, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === idx
          ? {
              ...item,
              links: { ...(item.links || {}), [linkKey]: val },
            }
          : item
      ),
    }));
  };

  const handleClubChange = (club) => {
    setFormData((prev) => ({
      ...prev,
      otherClubs: prev.otherClubs
        ? prev.otherClubs.includes(club)
          ? prev.otherClubs.filter((c) => c !== club)
          : [...prev.otherClubs, club]
        : [club],
    }));
  };

  if (loading && !profile)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/student-login");
  };

  const studentData = profile ? { user: profile, ...profile } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Student Profile"
        subtitle="Manage your profile and information"
        icon={GraduationCap}
        userData={studentData}
        profileRoute="/student-profile"
        changePasswordRoute="/student-change-password"
        onLogout={handleLogout}
        onIconClick={() => {
          if (window.location.pathname === '/student-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/student-dashboard');
          }
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* ✅ Toast Notification Component */}
        {(error || success) && (
          <ToastNotification
            type={error ? "error" : "success"}
            message={error || success}
            onClose={() => {
              setError("");
              setSuccess("");
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col lg:flex-row gap-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full">
          {/* Profile Card */}
          <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center self-start">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center relative">
      <div className="relative w-28 h-28 mx-auto mb-4 group">
        {/* Profile Image */}
        <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shadow-inner">
          {formData.profileImageUrl ? (
            <img
              src={formData.profileImageUrl}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <User className="h-14 w-14 text-purple-600" />
          )}
        </div>

        {/* Pencil Icon Overlay */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="absolute bottom-2 right-2 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full shadow-md transition-transform transform hover:scale-110"
        >
          <Pencil size={16} />
        </button>

        {/* Options Menu */}
        {showOptions && (
          <div
            ref={menuRef}
            className="absolute top-[115%] left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-xl w-48 text-sm z-20"
          >
            <button
              onClick={() => {
                document.getElementById("profilePicInput").click();
                setShowOptions(false);
              }}
              className="block w-full text-left px-4 py-3 hover:bg-purple-50 text-gray-800 font-medium transition"
            >
              🖊️ Update Profile
            </button>

            <div className="border-t border-gray-200"></div>

            <button
              onClick={() => alert("Remove Profile (demo only, not functional)")}
              className="block w-full text-left px-4 py-3 hover:bg-purple-50 text-red-500 font-medium"
            >
              Remove Profile
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          id="profilePicInput"
          type="file"
          accept="image/*"
          onChange={uploadProfileImage}
          disabled={uploadingImage}
          className="hidden"
        />
      </div>

      {/* Student Info */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {profile?.name || "Student Name"}
      </h2>
      <p className="text-gray-600 mb-4">{profile?.rollNo || "Roll Number"}</p>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
        <GraduationCap className="h-4 w-4" />
        <span>{profile?.college || "College"}</span>
      </div>

      {formData.crtBatchName && (
        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm inline-block">
          Batch: {formData.crtBatchName}
        </div>
      )}
    </div>

            {/* Resume Section */}
<div className="bg-white rounded-lg shadow-sm p-6 mt-4 relative">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold flex items-center">
      Resume
    </h3>

    {/* Pencil Icon & Dropdown */}
    <div className="relative" ref={resumeMenuRef}>
      <button
        onClick={() => setShowResumeOptions(!showResumeOptions)}
        className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full shadow-md transition-transform transform hover:scale-110"
      >
        <Pencil size={16} />
      </button>

      {showResumeOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg text-sm animate-fadeIn z-20">
          <button
            onClick={() => {
              document.getElementById("resumeFileInput").click();
              setShowResumeOptions(false);
            }}
            className="block w-full text-left px-4 py-3 hover:bg-purple-50 text-gray-800 font-medium transition"
          >
            📝 Update Resume
          </button>

          <div className="border-t border-gray-200"></div>

          <button
            onClick={() => alert("Remove Resume (demo only, not functional)")}
            className="block w-full text-left px-4 py-3 hover:bg-purple-50 text-red-500 font-medium"
          >
            Remove Resume
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Resume Display */}
  {formData.resumeUrl ? (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded border gap-2">
        <div className="flex items-center space-x-2">
          <Upload className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-700 break-all">
            {formData.resumeFileName || "Resume.pdf"}
          </span>
        </div>
        <div className="flex space-x-2">
          <a
            href={formData.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
          >
            View
          </a>
          <a
            href={formData.resumeUrl}
            download={formData.resumeFileName}
            className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-600 rounded hover:bg-green-50"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-gray-500 mb-4">No resume uploaded</p>
  )}

  {/* Hidden File Input */}
  <input
    id="resumeFileInput"
    type="file"
    accept=".pdf,.doc,.docx"
    onChange={uploadResume}
    disabled={uploadingResume}
    className="hidden"
  />

  {/* Uploading Indicator */}
  {uploadingResume && (
    <p className="text-sm text-blue-600 mt-2">Uploading...</p>
  )}
</div>
          </div>

          {/* ---------------- PROFILE DETAILS (FINAL UPDATED UI) ---------------- */}
<div className="flex-1 bg-white rounded-2xl shadow-sm p-8 pt-6 overflow-y-auto lg:max-h-[calc(100vh-130px)] max-h-none">

  {/* Header */}
  <div className="mb-6">
    <h2 className="text-2xl font-semibold text-gray-900">Profile Details</h2>
    <p className="text-sm text-gray-500">View or update your personal, academic and activity details.</p>
  </div>

  {/* ---------------- BASIC INFORMATION GRID ---------------- */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    {[
      "name",
      "rollNo",
      "email",
      "phonenumber",
      "college",
      "branch",
      "yearOfPassing",
      "gender",
      "dob",
      "currentLocation",
      "hometown",
      "bio",
    ].map((field) => (
      <div key={field}>
        <label className="block mb-1 text-xs text-gray-600 capitalize">
          {field.replace(/([A-Z])/g, " $1")}
        </label>

        {/* View Mode */}
        {!isEditing ? (
          <div className="bg-gray-50 px-4 py-2.5 rounded-md border border-transparent hover:border-gray-200 transition">
            <p className="text-sm text-gray-900 font-medium break-words">
              {formData[field] ||
                (field === "dob"
                  ? "Not provided"
                  : field === "gender"
                  ? "Not selected"
                  : "Not provided")}
            </p>
          </div>
        ) : field === "gender" ? (
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 h-10"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        ) : field === "dob" ? (
          <input
            type="date"
            name="dob"
            value={formData.dob ? formData.dob.slice(0, 10) : ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 h-10"
          />
        ) : field === "bio" ? (
          <textarea
            name="bio"
            value={formData.bio || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2"
            rows={3}
          />
        ) : (
          <input
            type="text"
            name={field}
            value={formData[field] || ""}
            onChange={handleInputChange}
            className="w-full border rounded p-2 h-10"
          />
        )}
      </div>
    ))}
  </div>

  {/* ---------------- CRT TRAINING PREFERENCES ---------------- */}
  <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-purple-100 p-3 rounded-lg">
        <GraduationCap className="text-purple-600" size={24} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">CRT Training Preferences</h2>
        <p className="text-sm text-gray-600">Choose your training track (requires TPO approval)</p>
      </div>
    </div>

    {/* View Mode */}
    {!isEditing && (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">CRT Status</p>
            <p className="font-semibold text-gray-900">
              {/* Determine status primarily from crtBatchName per TPO rule */}
              {(() => {
                const cbn = typeof profile?.crtBatchName === 'string' ? profile.crtBatchName.trim() : '';
                let status = 'NOT_UPDATED';
                if (cbn) {
                  if (/^PT/i.test(cbn)) status = 'CRT';
                  else if (/^NT/i.test(cbn)) status = 'NT';
                  else status = 'NOT_UPDATED';
                } else if (profile?.crtInterested === true) {
                  status = 'CRT';
                } else if (profile?.crtInterested === false) {
                  status = 'NT';
                }

                if (status === 'CRT') return <span className="inline-flex px-2 py-0.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">CRT</span>;
                if (status === 'NT') return <span className="inline-flex px-2 py-0.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">NT</span>;
                return <span className="inline-flex items-center px-1 py-0.5 rounded text-sm text-gray-500 bg-gray-100 border border-gray-200"><X className="h-3 w-3 mr-1 text-gray-400" />Not updated</span>;
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected Batch</p>
            <p className="font-semibold text-gray-900">{profile?.crtBatchChoice || "Not Selected"}</p>
          </div>
          {profile?.crtBatchName && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Assigned Training Batch</p>
              <p className="font-semibold text-indigo-600">{profile.crtBatchName}</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Edit Mode */}
    {isEditing && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Are you interested in CRT training?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="crtInterested"
                value="yes"
                checked={formData.crtInterested === true}
                onChange={handleCRTInterestChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="crtInterested"
                value="no"
                checked={formData.crtInterested === false}
                onChange={handleCRTInterestChange}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">No (NonCRT)</span>
            </label>
          </div>
        </div>

        {formData.crtInterested && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select CRT Training Batch *</label>

            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Available Options for your batch ({profile?.batchId?.batchNumber}):</strong>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableCRTOptions.filter(opt => opt !== "NonCRT").map(opt => (
                  <span key={opt} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            <select
              value={selectedCRTBatch}
              onChange={handleCRTBatchChoiceChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required={formData.crtInterested}
            >
              <option value="">-- Select Training Track --</option>
              {availableCRTOptions.filter(option => option !== 'NonCRT').map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <p className="text-xs text-gray-500 mt-2">
              Your batch administrator has configured these training options. Changes require TPO approval.
            </p>
          </div>
        )}

        {(formData.crtInterested !== profile?.crtInterested ||
          formData.crtBatchChoice !== profile?.crtBatchChoice) && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Approval Required</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your CRT preference changes will be sent to TPO for approval. You will receive notification once reviewed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Pending approvals card (kept functionality intact) */}
    {pendingApprovals?.totalPending > 0 && (
      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-sm text-orange-800 font-medium">You have {pendingApprovals.totalPending} pending approval request(s)</p>
        {pendingApprovals.requests?.map((req, idx) => (
          <div key={idx} className="mt-2 text-xs text-orange-700">
            {req.requestType === 'crt_status_change' && (
              <div>
                Requested: {req.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                {req.requestedChanges.crtBatchChoice && ` - ${req.requestedChanges.crtBatchChoice}`}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  {/* ---------------- TECHNOLOGY STACK (Skills) ---------------- */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-3">Technology Stack (Skills)</h3>
    <p className="text-sm text-gray-600 mb-3">Select the technologies you have skills in (independent of CRT batch choice)</p>

    {!isEditing ? (
      formData.techStack && formData.techStack.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {formData.techStack.map((t) => (
            <span key={t} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {t}
            </span>
          ))}
        </div>
      ) : (
        <div className="py-6 border border-dashed border-gray-200 rounded text-center">
          <p className="text-sm text-gray-400 italic">No skills added</p>
        </div>
      )
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {["Java", "Python", "C/C++", "JavaScript", "AIML"].map((tech) => (
          <label key={tech} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.techStack?.includes(tech) || false}
              onChange={() => handleTechStackChange(tech)}
              className="rounded"
            />
            <span>{tech}</span>
          </label>
        ))}
      </div>
    )}
  </div>

  {/* ---------------- CLUBS & ACTIVITIES ---------------- */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-3">Clubs & Activities</h3>

    {!isEditing ? (
      formData.otherClubs && formData.otherClubs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {formData.otherClubs.map((club) => (
            <span key={club} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {club}
            </span>
          ))}
        </div>
      ) : (
        <div className="py-6 border border-dashed border-gray-200 rounded text-center">
          <p className="text-sm text-gray-400 italic">No clubs selected</p>
        </div>
      )
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[
          "GCC",
          "k-hub",
          "robotics",
          "cyber crew",
          "toastmasters",
          "ncc",
          "nss",
          "google",
          "smart city",
        ].map((club) => (
          <label key={club} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.otherClubs?.includes(club) || false}
              onChange={() => handleClubChange(club)}
              className="rounded"
            />
            <span className="capitalize">{club}</span>
          </label>
        ))}
      </div>
    )}
  </div>

  {/* ---------------- ACADEMIC INFORMATION ---------------- */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-3">Academic Information</h3>

    <div className="mb-4">
      <label className="block mb-1">B.Tech CGPA</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.btechCGPA || "Not provided"}</div>
      ) : (
        <input
          type="number"
          step="0.01"
          min="0"
          max="10"
          name="academics.btechCGPA"
          value={formData.academics?.btechCGPA || ""}
          onChange={handleInputChange}
          className="w-full md:w-1/3 border rounded p-2"
        />
      )}
    </div>

    <div className="mb-4">
      <label className="block mb-1">Education Type</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-4 py-2 rounded border">{selectedEducationType === "inter" ? "Inter" : "Diploma"}</div>
      ) : (
        <select value={selectedEducationType} onChange={handleEducationTypeChange} className="border rounded p-2">
          <option value="inter">Inter</option>
          <option value="diploma">Diploma</option>
        </select>
      )}
    </div>

    {selectedEducationType === "inter" ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">Inter Percentage</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.inter?.percentage || "-"}</div>
          ) : (
            <input type="number" name="academics.inter.percentage" value={formData.academics?.inter?.percentage ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
        <div>
          <label className="block mb-1">Board</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.inter?.board || "-"}</div>
          ) : (
            <input type="text" name="academics.inter.board" value={formData.academics?.inter?.board ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
        <div>
          <label className="block mb-1">Passed Year</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.inter?.passedYear || "-"}</div>
          ) : (
            <input type="number" name="academics.inter.passedYear" value={formData.academics?.inter?.passedYear ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">Diploma Percentage</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.diploma?.percentage || "-"}</div>
          ) : (
            <input type="number" name="academics.diploma.percentage" value={formData.academics?.diploma?.percentage ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
        <div>
          <label className="block mb-1">Board</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.diploma?.board || "-"}</div>
          ) : (
            <input type="text" name="academics.diploma.board" value={formData.academics?.diploma?.board ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
        <div>
          <label className="block mb-1">Passed Year</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-4 py-2 rounded border">{formData.academics?.diploma?.passedYear || "-"}</div>
          ) : (
            <input type="number" name="academics.diploma.passedYear" value={formData.academics?.diploma?.passedYear ?? ""} onChange={handleInputChange} className="border p-2 rounded w-full" />
          )}
        </div>
      </div>
    )}

    <div className="mt-4 w-32">
      <label className="block mb-1">Backlogs</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-4 py-2 rounded border">{formData.backlogs ?? 0}</div>
      ) : (
        <input type="number" min="0" name="backlogs" value={formData.backlogs ?? 0} onChange={handleInputChange} className="border p-2 rounded w-full" />
      )}
    </div>
  </div>

  {/* ---------------- DYNAMIC SECTIONS: Projects, Internships, Appreciations, Certifications, Social Links ---------------- */}
  <ArraySection
    title="Projects"
    items={formData.projects || []}
    emptyCheck={isEmptyProject}
    emptyItem={emptyProject}
    addItem={() => addItemToArray("projects", emptyProject)}
    removeItem={(idx) => removeItemFromArray("projects", idx)}
    updateItem={updateItemInArray}
    updateLink={updateLinkInArray}
    isEditing={isEditing}
  />
  <ArraySection
    title="Internships"
    items={formData.internships || []}
    emptyCheck={isEmptyInternship}
    emptyItem={emptyInternship}
    addItem={() => addItemToArray("internships", emptyInternship)}
    removeItem={(idx) => removeItemFromArray("internships", idx)}
    updateItem={updateItemInArray}
    updateLink={updateLinkInArray}
    isEditing={isEditing}
  />
  <ArraySection
    title="Appreciations"
    items={formData.appreciations || []}
    emptyCheck={isEmptyAppreciation}
    emptyItem={emptyAppreciation}
    addItem={() => addItemToArray("appreciations", emptyAppreciation)}
    removeItem={(idx) => removeItemFromArray("appreciations", idx)}
    updateItem={updateItemInArray}
    isEditing={isEditing}
  />
  <ArraySection
    title="Certifications"
    items={formData.certifications || []}
    emptyCheck={isEmptyCertification}
    emptyItem={emptyCertification}
    addItem={() => addItemToArray("certifications", emptyCertification)}
    removeItem={(idx) => removeItemFromArray("certifications", idx)}
    updateItem={updateItemInArray}
    isEditing={isEditing}
  />
  <ArraySection
    title="Social Links"
    items={formData.socialLinks || []}
    emptyCheck={isEmptySocialLink}
    emptyItem={emptySocialLink}
    addItem={() => addItemToArray("socialLinks", emptySocialLink)}
    removeItem={(idx) => removeItemFromArray("socialLinks", idx)}
    updateItem={updateItemInArray}
    isEditing={isEditing}
  />
  {/* ---------------- MOBILE SAVE/CANCEL BUTTONS (INLINE AT BOTTOM) ---------------- */}
{isEditing && (
  <div className="w-full flex justify-center mt-8">
    {/* ✅ This entire section will be hidden on desktop and shown only on mobile */}
    <div className="flex justify-center gap-4 md:hidden">
      <button
        onClick={handleCancel}
        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
      >
        <X className="h-4 w-4" />
        <span>Cancel</span>
      </button>
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        <span>{loading ? "Saving..." : "Save"}</span>
      </button>
    </div>
  </div>
)}
</div>
        </div>
      </div>
      </main>
    </div>
  );
};

{/* ---------------- ARRAYSECTION COMPONENT (FINAL UPDATED) ---------------- */}
function ArraySection({
  title,
  items,
  emptyCheck,
  emptyItem,
  addItem,
  removeItem,
  updateItem,
  updateLink,
  isEditing,
}) {
  const hasEmpty = Array.isArray(items) && items.some(emptyCheck);

  // Render read-only summary cards for view mode
  const renderViewCard = (item, idx) => {
    if (title === "Projects") {
      return (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
          <h5 className="font-semibold text-gray-800">{item.title || "Untitled Project"}</h5>
          <p className="text-sm text-gray-600 mt-1">{item.description || "No description provided."}</p>
          {(item.techStack && item.techStack.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.techStack.map((t, i) => (
                <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{t}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (title === "Internships") {
      return (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
          <h5 className="font-semibold text-gray-800">{item.role || "Internship"}</h5>
          <p className="text-sm text-gray-600">{item.company ? `${item.company} • ${item.location || ""}` : "Company not provided"}</p>
          <p className="text-sm text-gray-500 mt-2">{item.experience || ""}</p>
        </div>
      );
    }

    if (title === "Appreciations") {
      return (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
          <h5 className="font-semibold text-gray-800">{item.title || "Appreciation"}</h5>
          <p className="text-sm text-gray-600">{item.description || ""}</p>
          <p className="text-xs text-gray-500 mt-2">{item.givenBy ? `By ${item.givenBy}` : ""}</p>
        </div>
      );
    }

    if (title === "Certifications") {
      return (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
          <h5 className="font-semibold text-gray-800">{item.name || "Certification"}</h5>
          <p className="text-sm text-gray-600">{item.issuer || ""}</p>
          <p className="text-xs text-gray-500 mt-2">{item.credentialId ? `ID: ${item.credentialId}` : ""}</p>
        </div>
      );
    }

    if (title === "Social Links") {
      return (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
          <h5 className="font-semibold text-gray-800">{item.platform || "Social Link"}</h5>
          <a href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 break-all">
            {item.url || "No URL"}
          </a>
        </div>
      );
    }

    // fallback
    return (
      <div key={idx} className="bg-gray-50 border rounded p-4 mb-4">
        <pre className="text-xs text-gray-700">{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="mb-10">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>

      {/* Empty state */}
      {(!items || items.length === 0) && (
        <div className="text-center py-6 border border-dashed rounded-lg bg-white">
          <p className="text-sm text-gray-400 italic">
            {title === "Projects" && "No projects added"}
            {title === "Internships" && "No internships added"}
            {title === "Appreciations" && "No appreciations added"}
            {title === "Certifications" && "No certifications available"}
            {title === "Social Links" && "No social media links available"}
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={addItem}
              disabled={!isEditing}
              className={`text-purple-700 font-semibold ${!isEditing ? "opacity-50 cursor-not-allowed" : "hover:text-purple-900"}`}
            >
              + Add {title.slice(0, -1)}
            </button>
          </div>
        </div>
      )}

      {/* Render items */}
      {items && items.length > 0 && (
        <>
          {items.map((item, idx) => (
            <div key={idx}>
              {/* View mode summary */}
              {!isEditing && renderViewCard(item, idx)}

              {/* Edit mode full form */}
              {isEditing && (
                <div className="bg-gray-50 border rounded p-4 mb-4 relative">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 right-2 text-red-600 font-bold hover:text-red-800"
                  >
                    ×
                  </button>

                  {title === "Projects" && (
                    <>
                      <label className="block mb-1 text-sm">Title</label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) => updateItem("projects", idx, "title", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                      <label className="block mb-1 text-sm">Tech Stack (comma separated)</label>
                      <input
                        type="text"
                        value={(item.techStack || []).join(", ")}
                        onChange={(e) =>
                          updateItem("projects", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))
                        }
                        className="w-full p-2 border rounded mb-2"
                      />
                      <label className="block mb-1 text-sm">Description</label>
                      <textarea
                        value={item.description || ""}
                        onChange={(e) => updateItem("projects", idx, "description", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                      {["github", "live", "demo"].map((linkKey) => (
                        <div key={linkKey}>
                          <label className="block mb-1 text-sm">{linkKey.charAt(0).toUpperCase() + linkKey.slice(1)}</label>
                          <input
                            type="text"
                            value={item.links?.[linkKey] || ""}
                            onChange={(e) => updateLink("projects", idx, linkKey, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                      <label className="block mb-1 text-sm">Start Date</label>
                      <input
                        type="date"
                        value={item.startDate ? item.startDate.slice(0, 10) : ""}
                        onChange={(e) => updateItem("projects", idx, "startDate", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                      <label className="block mb-1 text-sm">End Date</label>
                      <input
                        type="date"
                        value={item.endDate ? item.endDate.slice(0, 10) : ""}
                        onChange={(e) => updateItem("projects", idx, "endDate", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                    </>
                  )}

                  {title === "Internships" && (
                    <>
                      {["company", "role", "location", "experience"].map((field) => (
                        <div key={field}>
                          <label className="block mb-1 text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={item[field] || ""}
                            onChange={(e) => updateItem("internships", idx, field, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                      <label className="block mb-1 text-sm">Tech Stack (comma separated)</label>
                      <input
                        type="text"
                        value={(item.techStack || []).join(", ")}
                        onChange={(e) =>
                          updateItem("internships", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))
                        }
                        className="w-full p-2 border rounded mb-2"
                      />
                      <label className="block mb-1 text-sm">Start Date</label>
                      <input
                        type="date"
                        value={item.startDate ? item.startDate.slice(0, 10) : ""}
                        onChange={(e) => updateItem("internships", idx, "startDate", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                      <label className="block mb-1 text-sm">End Date</label>
                      <input
                        type="date"
                        value={item.endDate ? item.endDate.slice(0, 10) : ""}
                        onChange={(e) => updateItem("internships", idx, "endDate", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                    </>
                  )}

                  {title === "Appreciations" && (
                    <>
                      {["title", "description", "givenBy"].map((field) => (
                        <div key={field}>
                          <label className="block mb-1 text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={item[field] || ""}
                            onChange={(e) => updateItem("appreciations", idx, field, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                      <label className="block mb-1 text-sm">Date Received</label>
                      <input
                        type="date"
                        value={item.dateReceived ? item.dateReceived.slice(0, 10) : ""}
                        onChange={(e) => updateItem("appreciations", idx, "dateReceived", e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                    </>
                  )}

                  {title === "Certifications" && (
                    <>
                      {["name", "issuer", "credentialId", "imageUrl"].map((field) => (
                        <div key={field}>
                          <label className="block mb-1 text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={item[field] || ""}
                            onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                      {["dateIssued", "expiryDate"].map((field) => (
                        <div key={field}>
                          <label className="block mb-1 text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="date"
                            value={item[field] ? item[field].slice(0, 10) : ""}
                            onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {title === "Social Links" && (
                    <>
                      {["platform", "url"].map((field) => (
                        <div key={field}>
                          <label className="block mb-1 text-sm">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={item[field] || ""}
                            onChange={(e) => updateItem("socialLinks", idx, field, e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="mt-2">
            <button
              type="button"
              onClick={addItem}
              disabled={hasEmpty || !isEditing}
              className={`text-purple-700 font-semibold ${hasEmpty || !isEditing ? "opacity-50 cursor-not-allowed" : "hover:text-purple-900"}`}
            >
              + Add {title.slice(0, -1)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentProfile;