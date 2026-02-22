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
  ArrowLeft,
} from "lucide-react";
import {
  getProfile,
  updateProfile,
  checkPasswordChange,
} from "../../services/generalAuthService";
import api from '../../services/api';
import ToastNotification from "../../components/ui/ToastNotification";
import Header from "../../components/common/Header";
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import useHeaderData from '../../hooks/useHeaderData';
const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [pendingApprovals, setPendingApprovals] = useState({ pending: [], approved: [], rejected: [], totalPending: 0, requests: [] });
  const [availableCRTOptions, setAvailableCRTOptions] = useState([]);
  const [availableTechStacks, setAvailableTechStacks] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showResumeOptions, setShowResumeOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const resumeMenuRef = useRef(null);

  const header = useHeaderData('student', profile ? { user: profile, ...profile } : null);

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    const fetchAvailableTechStacks = async () => {
      try {
        const response = await api.get('/api/student/available-crt-options');
        if (response.data.success) {
          // batchAllowedTechStacks is an array of tech stack names (not CRT batch names)
          setAvailableTechStacks(response.data.data.batchAllowedTechStacks || []);
          // also set availableCRTOptions if returned here (safe fallback)
          if (response.data.data.availableOptions) {
            setAvailableCRTOptions(response.data.data.availableOptions || []);
          }
        }
      } catch (error) {
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

      const response = await getProfile('student');

      if (response && response.data && response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData(data);
        setSelectedEducationType(data.academics?.educationType || "inter");
        setSelectedCRTBatch(data.crtBatchChoice || "");
        setAvailableCRTOptions(data.availableCRTOptions || ['NonCRT']);

        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({
          ...userData,
          ...data
        }));
      } else {
        setError((response && response.data && response.data.message) || "Failed to fetch profile");
        if (response && response.status === 401) {
          localStorage.removeItem("userToken");
          localStorage.removeItem("userData");
          navigate("/student-login");
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        navigate('/student-login');
        return;
      }
      setError(err?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/api/student/pending-approvals');
      if (response.data.success) {
        // Normalize backend shape to include `requests` for compatibility with UI
        const dataObj = response.data.data || {};
        dataObj.requests = dataObj.pending || [];
        setPendingApprovals(dataObj);
      }
    } catch (error) {
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

    const payload = new FormData();
    payload.append('profileImage', file);
    setUploadingImage(true);

    try {
      const resp = await api.post('/api/student/profile-image', payload);
      if (resp.data && resp.data.success) {
        setFormData(prev => ({ ...prev, profileImageUrl: resp.data.data }));
        setSuccess('Profile image uploaded successfully');
      } else {
        throw new Error(resp.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err?.message || 'Error uploading profile image');
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

    const payload = new FormData();
    payload.append('resume', file);
    setUploadingResume(true);

    try {
      const resp = await api.post('/api/student/resume', payload);
      if (resp.data && resp.data.success) {
        setFormData(prev => ({
          ...prev,
          resumeUrl: resp.data.data.url,
          resumeFileName: resp.data.data.fileName
        }));
        setSuccess('Resume uploaded successfully');
      } else {
        throw new Error(resp.data?.message || 'Failed to upload resume');
      }
    } catch (err) {
      setError(err?.message || 'Error uploading resume');
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

      const response = await updateProfile('student', dataToSend);

      if (response && response.data && response.data.success) {
        const result = response.data;
        // If backend returns requiresApproval flag
        if (result.requiresApproval) {
          setSuccess('Profile updated. Changes requiring approval have been sent to the assigned TPO for review.');
          await fetchPendingApprovals();
        } else {
          setProfile(result.data);
          setFormData(result.data);
          setIsEditing(false);
          setSuccess('Profile updated successfully!');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const respData = response?.data || {};
        if (respData.hasPendingApproval) {
          setError('You already have a pending approval request. Please wait for TPO review.');
        } else {
          setError(respData.message || 'Failed to update profile');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the profile. Please try again.');
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

  if (loading && !profile) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Student Profile"
        subtitle="Manage your profile and information"
        {...header.headerProps}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Toast Notification */}
        {(error || success) && (
          <ToastNotification
            type={error ? "error" : "success"}
            message={error || success}
            onClose={() => { setError(""); setSuccess(""); }}
          />
        )}

        {/* Back + Action Buttons — same row */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/student-dashboard')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Back to Dashboard
          </button>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium"
              >
                <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{loading ? "Saving..." : "Save"}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Profile Card */}
          <div className="w-full lg:w-1/3 space-y-4 self-start">
            {/* Avatar & Info Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg"><User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">My Profile</h3>
              </div>
              <div className="p-4 sm:p-6 text-center relative">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3 sm:mb-4 group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center border-2 border-blue-200">
                    {formData.profileImageUrl ? (
                      <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <User className="h-10 w-10 sm:h-14 sm:w-14 text-blue-400" />
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 sm:p-2 rounded-full shadow-md transition-transform transform hover:scale-110"
                      >
                        <Pencil size={14} />
                      </button>
                      {showOptions && (
                        <div ref={menuRef} className="absolute top-[115%] left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl w-44 sm:w-48 text-sm z-20">
                          <button
                            onClick={() => { document.getElementById("profilePicInput").click(); setShowOptions(false); }}
                            className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-blue-50 text-gray-800 font-medium transition text-xs sm:text-sm"
                          >
                            Update Photo
                          </button>
                          <div className="border-t border-gray-200"></div>
                          <button
                            onClick={() => setError('Remove Profile (demo only, not functional)')}
                            className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-red-50 text-red-500 font-medium text-xs sm:text-sm"
                          >
                            Remove Photo
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <input id="profilePicInput" type="file" accept="image/*" onChange={uploadProfileImage} disabled={uploadingImage} className="hidden" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{profile?.name || "Student Name"}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-3">{profile?.rollNo || "Roll Number"}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-2">
                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  <span>{profile?.college || "College"}</span>
                </div>
                {formData.crtBatchName && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
                    Batch: {formData.crtBatchName}
                  </span>
                )}
              </div>
            </div>

            {/* Resume Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Resume</h3>
                </div>
                {isEditing && (
                  <div className="relative" ref={resumeMenuRef}>
                    <button
                      onClick={() => setShowResumeOptions(!showResumeOptions)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 sm:p-2 rounded-full shadow-sm transition-transform transform hover:scale-110"
                    >
                      <Pencil size={14} />
                    </button>
                    {showResumeOptions && (
                      <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg text-sm z-20">
                        <button
                          onClick={() => { document.getElementById("resumeFileInput").click(); setShowResumeOptions(false); }}
                          className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-blue-50 text-gray-800 font-medium transition text-xs sm:text-sm"
                        >
                          Update Resume
                        </button>
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={() => setError('Remove Resume (demo only, not functional)')}
                          className="block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-red-50 text-red-500 font-medium text-xs sm:text-sm"
                        >
                          Remove Resume
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                {formData.resumeUrl ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Upload className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">{formData.resumeFileName || "Resume.pdf"}</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2.5 py-1 border border-blue-300 rounded-md hover:bg-blue-50 font-medium flex items-center gap-1">
                        <Eye className="h-3 w-3" /> View
                      </a>
                      <a href={formData.resumeUrl} download={formData.resumeFileName}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-800 px-2.5 py-1 border border-green-300 rounded-md hover:bg-green-50 font-medium flex items-center gap-1">
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">No resume uploaded</p>
                  </div>
                )}
                <input id="resumeFileInput" type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} disabled={uploadingResume} className="hidden" />
                {uploadingResume && <p className="text-xs text-blue-600 mt-2">Uploading...</p>}
              </div>
            </div>
          </div>

          {/* ---------------- PROFILE DETAILS ---------------- */}
<div className="flex-1 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-130px)] max-h-none">

  {/* Basic Information */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg"><User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Basic Information</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Personal and contact details</p>
      </div>
    </div>
    <div className="p-3 sm:p-4">

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
      <div key={field} className={field === "bio" ? "sm:col-span-2" : ""}>
        <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
          {field.replace(/([A-Z])/g, " $1")}
        </label>
        {!isEditing ? (
          <div className="bg-gray-50 px-3 py-2 sm:px-4 sm:py-2.5 rounded-md border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-900 font-medium break-words">
              {formData[field] ||
                (field === "dob"
                  ? "Not provided"
                  : field === "gender"
                  ? "Not selected"
                  : "Not provided")}
            </p>
          </div>
        ) : field === "gender" ? (
          <select name="gender" value={formData.gender || ""} onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-xs sm:text-sm h-9 sm:h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        ) : field === "dob" ? (
          <input type="date" name="dob" value={formData.dob ? formData.dob.slice(0, 10) : ""} onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-xs sm:text-sm h-9 sm:h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        ) : field === "bio" ? (
          <textarea name="bio" value={formData.bio || ""} onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
        ) : (
          <input type="text" name={field} value={formData[field] || ""} onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-xs sm:text-sm h-9 sm:h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        )}
      </div>
    ))}
  </div>
    </div>
  </div>

  {/* ---------------- JOB & PLACEMENT STATUS ---------------- */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Job & Placement Status</h2>
        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Your current placement information</p>
      </div>
    </div>
    <div className="p-3 sm:p-4">

    {/* Status Badge */}
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
      <span className="text-xs sm:text-sm text-gray-500 font-medium">Status:</span>
      {profile?.status === 'placed' ? (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Placed
        </span>
      ) : profile?.status === 'completed' ? (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" /> Completed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" /> Pursuing
        </span>
      )}
    </div>

    {/* Primary Placement Details */}
    {profile?.status === 'placed' && profile?.placementDetails?.company && (
      <div className="bg-green-50 border border-green-100 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <p className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase tracking-wide">Primary Offer</p>
          {(() => {
            const t = profile.placementDetails.type || 'PLACEMENT';
            const s = { PLACEMENT: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-blue-100 text-blue-700', TRAINING: 'bg-orange-100 text-orange-700' };
            return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s[t] || s.PLACEMENT}`}>{t}</span>;
          })()}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5">Company</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              {profile.placementDetails.company}
            </p>
          </div>
          {(profile.placementDetails.type || 'PLACEMENT') === 'PLACEMENT' ? (
            profile.placementDetails.package ? (
              <div>
                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5">Package</p>
                <p className="text-xs sm:text-sm font-semibold text-green-700">{profile.placementDetails.package} LPA</p>
              </div>
            ) : null
          ) : (
            <div>
              <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5">Stipend</p>
              <p className="text-xs sm:text-sm font-semibold text-green-700">{profile.placementDetails.stipend || 0} K/month{profile.placementDetails.duration && profile.placementDetails.duration !== 'FULL TIME' ? ` · ${profile.placementDetails.duration} months` : ''}</p>
            </div>
          )}
          {profile.placementDetails.location && (
            <div>
              <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5">Location</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                {profile.placementDetails.location}
              </p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* All Offers */}
    {profile?.allOffers && profile.allOffers.length > 0 && (
      <div>
        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">All Offers ({profile.allOffers.length})</p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-50 text-[10px] sm:text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-left font-medium">#</th>
                <th className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-left font-medium">Company</th>
                <th className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-left font-medium">Type</th>
                <th className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-left font-medium">Compensation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profile.allOffers.map((offer, i) => {
                const t = offer.type || 'PLACEMENT';
                const badgeStyle = { PLACEMENT: 'bg-green-100 text-green-700', INTERNSHIP: 'bg-blue-100 text-blue-700', TRAINING: 'bg-orange-100 text-orange-700' };
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-gray-500">{i + 1}</td>
                    <td className="px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-gray-900">{offer.company || '—'}</td>
                    <td className="px-2.5 sm:px-4 py-1.5 sm:py-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyle[t] || badgeStyle.PLACEMENT}`}>{t}</span>
                    </td>
                    <td className="px-2.5 sm:px-4 py-1.5 sm:py-2 font-semibold text-green-700">
                      {t === 'PLACEMENT'
                        ? (offer.package ? `${offer.package} LPA` : '—')
                        : `${offer.stipend || 0} K/month`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Not placed yet message */}
    {profile?.status !== 'placed' && (!profile?.allOffers || profile.allOffers.length === 0) && (
      <div className="flex items-center gap-2 sm:gap-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3 sm:p-4 text-yellow-800">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="text-xs sm:text-sm font-medium">No placement recorded yet</p>
          <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5">Your placement details will appear here once updated by your TPO.</p>
        </div>
      </div>
    )}
  </div>
  </div>

  {/* ---------------- CRT TRAINING PREFERENCES ---------------- */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg">
        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-gray-700">CRT Training Preferences</h2>
        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Choose your training track (requires TPO approval)</p>
      </div>
    </div>
    <div className="p-3 sm:p-4">

    {/* View Mode */}
    {!isEditing && (
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-sm text-gray-600">CRT Status</p>
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
  </div>

  {/* ---------------- TECHNOLOGY STACK (Skills) ---------------- */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Technology Stack (Skills)</h3>
    </div>
    <div className="p-3 sm:p-4">
    <p className="text-[10px] sm:text-xs text-gray-500 mb-3">Select the technologies you have skills in</p>

    {!isEditing ? (
      formData.techStack && formData.techStack.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {formData.techStack.map((t) => (
            <span key={t} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium">
              {t}
            </span>
          ))}
        </div>
      ) : (
        <div className="py-4 sm:py-6 text-center">
          <Code2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[10px] sm:text-xs text-gray-400">No skills added</p>
        </div>
      )
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {["Java", "Python", "C/C++", "JavaScript", "AIML"].map((tech) => (
          <label key={tech} className="flex items-center gap-2 p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
            <input type="checkbox" checked={formData.techStack?.includes(tech) || false} onChange={() => handleTechStackChange(tech)}
              className="rounded text-blue-600 focus:ring-blue-500" />
            <span className="text-xs sm:text-sm text-gray-700">{tech}</span>
          </label>
        ))}
      </div>
    )}
    </div>
  </div>

  {/* ---------------- CLUBS & ACTIVITIES ---------------- */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Clubs & Activities</h3>
    </div>
    <div className="p-3 sm:p-4">
    {!isEditing ? (
      formData.otherClubs && formData.otherClubs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {formData.otherClubs.map((club) => (
            <span key={club} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium capitalize">
              {club}
            </span>
          ))}
        </div>
      ) : (
        <div className="py-4 sm:py-6 text-center">
          <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[10px] sm:text-xs text-gray-400">No clubs selected</p>
        </div>
      )
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {["GCC", "k-hub", "robotics", "cyber crew", "toastmasters", "ncc", "nss", "google", "smart city"].map((club) => (
          <label key={club} className="flex items-center gap-2 p-2 sm:p-2.5 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
            <input type="checkbox" checked={formData.otherClubs?.includes(club) || false} onChange={() => handleClubChange(club)}
              className="rounded text-blue-600 focus:ring-blue-500" />
            <span className="text-xs sm:text-sm text-gray-700 capitalize">{club}</span>
          </label>
        ))}
      </div>
    )}
    </div>
  </div>

  {/* ---------------- ACADEMIC INFORMATION ---------------- */}
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg">
        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Academic Information</h3>
    </div>
    <div className="p-3 sm:p-4">

    <div className="mb-3 sm:mb-4">
      <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">B.Tech CGPA</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.btechCGPA || "Not provided"}</div>
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

    <div className="mb-3 sm:mb-4">
      <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Education Type</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{selectedEducationType === "inter" ? "Inter" : "Diploma"}</div>
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
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Inter %</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.inter?.percentage || "-"}</div>
          ) : (
            <input type="number" name="academics.inter.percentage" value={formData.academics?.inter?.percentage ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
        <div>
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Board</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.inter?.board || "-"}</div>
          ) : (
            <input type="text" name="academics.inter.board" value={formData.academics?.inter?.board ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
        <div>
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Passed Year</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.inter?.passedYear || "-"}</div>
          ) : (
            <input type="number" name="academics.inter.passedYear" value={formData.academics?.inter?.passedYear ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Diploma %</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.diploma?.percentage || "-"}</div>
          ) : (
            <input type="number" name="academics.diploma.percentage" value={formData.academics?.diploma?.percentage ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
        <div>
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Board</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.diploma?.board || "-"}</div>
          ) : (
            <input type="text" name="academics.diploma.board" value={formData.academics?.diploma?.board ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
        <div>
          <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Passed Year</label>
          {!isEditing ? (
            <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.academics?.diploma?.passedYear || "-"}</div>
          ) : (
            <input type="number" name="academics.diploma.passedYear" value={formData.academics?.diploma?.passedYear ?? ""} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          )}
        </div>
      </div>
    )}

    <div className="mt-4 w-32">
      <label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">Backlogs</label>
      {!isEditing ? (
        <div className="bg-gray-50 px-3 py-2 sm:px-4 rounded-md border border-gray-100 text-xs sm:text-sm text-gray-900 font-medium">{formData.backlogs ?? 0}</div>
      ) : (
        <input type="number" min="0" name="backlogs" value={formData.backlogs ?? 0} onChange={handleInputChange} className="border border-gray-300 p-2 rounded-md w-full text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      )}
    </div>
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
  {/* Mobile Save/Cancel Buttons */}
{isEditing && (
  <div className="flex justify-center gap-3 mt-4 sm:mt-6 sm:hidden">
    <button onClick={handleCancel}
      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1.5 text-xs font-medium">
      <X className="h-3.5 w-3.5" /> Cancel
    </button>
    <button onClick={handleSave} disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50">
      <Save className="h-3.5 w-3.5" /> {loading ? "Saving..." : "Save"}
    </button>
  </div>
)}
</div>
        </div>
      </main>
    </div>
  );
};

{/* ---------------- ARRAYSECTION COMPONENT ---------------- */}
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

  const sectionIcons = {
    Projects: Code2,
    Internships: Briefcase,
    Appreciations: Award,
    Certifications: Award,
    "Social Links": ExternalLink,
  };
  const SectionIcon = sectionIcons[title] || Star;

  const renderViewCard = (item, idx) => {
    if (title === "Projects") {
      return (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{item.title || "Untitled Project"}</h5>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-1">{item.description || "No description provided."}</p>
          {(item.techStack && item.techStack.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.techStack.map((t, i) => (
                <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (title === "Internships") {
      return (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{item.role || "Internship"}</h5>
          <p className="text-[10px] sm:text-xs text-gray-600">{item.company ? `${item.company} • ${item.location || ""}` : "Company not provided"}</p>
          {item.experience && <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{item.experience}</p>}
        </div>
      );
    }
    if (title === "Appreciations") {
      return (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{item.title || "Appreciation"}</h5>
          <p className="text-[10px] sm:text-xs text-gray-600">{item.description || ""}</p>
          {item.givenBy && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">By {item.givenBy}</p>}
        </div>
      );
    }
    if (title === "Certifications") {
      return (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{item.name || "Certification"}</h5>
          <p className="text-[10px] sm:text-xs text-gray-600">{item.issuer || ""}</p>
          {item.credentialId && <p className="text-[10px] sm:text-xs text-gray-400 mt-1">ID: {item.credentialId}</p>}
        </div>
      );
    }
    if (title === "Social Links") {
      return (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-900">{item.platform || "Social Link"}</h5>
          <a href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-blue-600 break-all hover:text-blue-800">
            {item.url || "No URL"}
          </a>
        </div>
      );
    }
    return (
      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
        <pre className="text-[10px] sm:text-xs text-gray-700">{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4">
      <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg"><SectionIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700">{title}</h3>
        {items && items.length > 0 && <span className="ml-auto text-[10px] sm:text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>}
      </div>
      <div className="p-3 sm:p-4">

      {(!items || items.length === 0) && (
        <div className="text-center py-4 sm:py-6">
          <SectionIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-[10px] sm:text-xs text-gray-400">
            {title === "Projects" && "No projects added"}
            {title === "Internships" && "No internships added"}
            {title === "Appreciations" && "No appreciations added"}
            {title === "Certifications" && "No certifications available"}
            {title === "Social Links" && "No social media links available"}
          </p>
          {isEditing && (
            <button type="button" onClick={addItem}
              className="mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Add {title.slice(0, -1)}
            </button>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx}>
              {!isEditing && renderViewCard(item, idx)}
              {isEditing && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 relative">
                  <button type="button" onClick={() => removeItem(idx)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors">
                    ×
                  </button>

                  {title === "Projects" && (
                    <div className="space-y-2">
                      <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Title</label>
                      <input type="text" value={item.title || ""} onChange={(e) => updateItem("projects", idx, "title", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Tech Stack (comma separated)</label>
                      <input type="text" value={(item.techStack || []).join(", ")} onChange={(e) => updateItem("projects", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))}
                        className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Description</label>
                      <textarea value={item.description || ""} onChange={(e) => updateItem("projects", idx, "description", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={2} /></div>
                      {["github", "live", "demo"].map((linkKey) => (
                        <div key={linkKey}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{linkKey.charAt(0).toUpperCase() + linkKey.slice(1)}</label>
                        <input type="text" value={item.links?.[linkKey] || ""} onChange={(e) => updateLink("projects", idx, linkKey, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Start Date</label>
                        <input type="date" value={item.startDate ? item.startDate.slice(0, 10) : ""} onChange={(e) => updateItem("projects", idx, "startDate", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                        <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">End Date</label>
                        <input type="date" value={item.endDate ? item.endDate.slice(0, 10) : ""} onChange={(e) => updateItem("projects", idx, "endDate", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      </div>
                    </div>
                  )}

                  {title === "Internships" && (
                    <div className="space-y-2">
                      {["company", "role", "location", "experience"].map((field) => (
                        <div key={field}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input type="text" value={item[field] || ""} onChange={(e) => updateItem("internships", idx, field, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      ))}
                      <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Tech Stack (comma separated)</label>
                      <input type="text" value={(item.techStack || []).join(", ")} onChange={(e) => updateItem("internships", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))}
                        className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Start Date</label>
                        <input type="date" value={item.startDate ? item.startDate.slice(0, 10) : ""} onChange={(e) => updateItem("internships", idx, "startDate", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                        <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">End Date</label>
                        <input type="date" value={item.endDate ? item.endDate.slice(0, 10) : ""} onChange={(e) => updateItem("internships", idx, "endDate", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      </div>
                    </div>
                  )}

                  {title === "Appreciations" && (
                    <div className="space-y-2">
                      {["title", "description", "givenBy"].map((field) => (
                        <div key={field}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input type="text" value={item[field] || ""} onChange={(e) => updateItem("appreciations", idx, field, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      ))}
                      <div><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">Date Received</label>
                      <input type="date" value={item.dateReceived ? item.dateReceived.slice(0, 10) : ""} onChange={(e) => updateItem("appreciations", idx, "dateReceived", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                    </div>
                  )}

                  {title === "Certifications" && (
                    <div className="space-y-2">
                      {["name", "issuer", "credentialId", "imageUrl"].map((field) => (
                        <div key={field}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input type="text" value={item[field] || ""} onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        {["dateIssued", "expiryDate"].map((field) => (
                          <div key={field}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                          <input type="date" value={item[field] ? item[field].slice(0, 10) : ""} onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {title === "Social Links" && (
                    <div className="space-y-2">
                      {["platform", "url"].map((field) => (
                        <div key={field}><label className="block mb-1 text-[10px] sm:text-xs font-medium text-gray-500">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input type="text" value={item[field] || ""} onChange={(e) => updateItem("socialLinks", idx, field, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>

          {isEditing && (
            <div className="mt-3">
              <button type="button" onClick={addItem} disabled={hasEmpty}
                className={`text-xs sm:text-sm text-blue-600 font-medium ${hasEmpty ? "opacity-50 cursor-not-allowed" : "hover:text-blue-800"}`}>
                + Add {title.slice(0, -1)}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export default StudentProfile;