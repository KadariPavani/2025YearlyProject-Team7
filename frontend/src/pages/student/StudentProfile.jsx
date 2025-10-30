// src/components/student/StudentProfile.jsx

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
    fetchPendingApprovals();
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
      crtBatchChoice: newBatch
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

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/student-dashboard")}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
            <div className="flex flex-col space-y-2">
              <ApprovalStatusBanner />
              <RejectedApprovalsBanner />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/student-change-password")}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </button>

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
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-gray-50 flex items-center justify-center">
                {formData.profileImageUrl ? (
                  <img
                    src={formData.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-purple-600" />
                )}
              </div>

              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadProfileImage}
                  disabled={uploadingImage}
                  className="mb-4 w-full text-sm"
                />
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-2">{profile?.name || "Student Name"}</h2>
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
            <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
              <h3 className="text-lg font-semibold mb-4">Resume</h3>
              {formData.resumeUrl ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">
                        {formData.resumeFileName || 'Resume.pdf'}
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

              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={uploadResume}
                    disabled={uploadingResume}
                    className="w-full text-sm"
                  />
                  {uploadingResume && (
                    <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 overflow-auto max-h-[80vh]">
            {/* Basic Information */}
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
                  <label className="block mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
                  {field === "gender" ? (
                    <select
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full border rounded p-2"
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
                      disabled={!isEditing}
                      className="w-full border rounded p-2"
                    />
                  ) : field === "bio" ? (
                    <textarea
                      name="bio"
                      value={formData.bio || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full border rounded p-2"
                      rows={3}
                    />
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full border rounded p-2"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* CRT Training Preferences Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <GraduationCap className="text-purple-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    CRT Training Preferences
                  </h2>
                  <p className="text-sm text-gray-600">
                    Choose your training track (requires TPO approval)
                  </p>
                </div>
              </div>

              {/* Current Status (View Mode) */}
              {!isEditing && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">CRT Status</p>
                      <p className="font-semibold text-gray-900">
                        {profile?.crtInterested ? (
                          <span className="text-green-600">Interested</span>
                        ) : (
                          <span className="text-gray-500">Not Interested</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Selected Batch</p>
                      <p className="font-semibold text-gray-900">
                        {profile?.crtBatchChoice || 'Not Selected'}
                      </p>
                    </div>
                    {profile?.crtBatchName && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Assigned Training Batch</p>
                        <p className="font-semibold text-indigo-600">
                          {profile.crtBatchName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Editing Mode */}
              {isEditing && (
                <div className="space-y-4">
                  {/* CRT Interest */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are you interested in CRT training?
                    </label>
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

                  {/* CRT Batch Choice */}
                  {formData.crtInterested && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select CRT Training Batch *
                      </label>

                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Available Options for your batch ({profile?.batchId?.batchNumber}):</strong>
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableCRTOptions.filter(opt => opt !== 'NonCRT').map(opt => (
                            <span key={opt} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>

                      <select
                        value={selectedCRTBatch}
                        onChange={handleCRTBatchChoiceChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required={formData.crtInterested}
                      >
                        <option value="">-- Select Training Track --</option>
                        {availableCRTOptions
                          .filter(option => option !== 'NonCRT')
                          .map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                      </select>

                      <p className="text-xs text-gray-500 mt-2">
                        Your batch administrator has configured these training options. Changes require TPO approval.
                      </p>
                    </div>
                  )}

                  {/* Approval Warning */}
                  {(formData.crtInterested !== profile?.crtInterested || 
                    formData.crtBatchChoice !== profile?.crtBatchChoice) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            Approval Required
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Your CRT preference changes will be sent to TPO for approval.
                            You will receive notification once reviewed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Approvals */}
              {pendingApprovals?.totalPending > 0 && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    You have {pendingApprovals.totalPending} pending approval request(s)
                  </p>
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

            {/* Tech Stack (Independent) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Technology Stack (Skills)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select the technologies you have skills in (independent of CRT batch choice)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Java', 'Python', 'C/C++', 'JavaScript', 'AIML'].map((tech) => (
                  <label 
                    key={tech} 
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.techStack?.includes(tech) || false}
                      onChange={() => handleTechStackChange(tech)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span>{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clubs & Activities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Clubs & Activities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['GCC', 'k-hub', 'robotics', 'cyber crew', 'toastmasters', 'ncc', 'nss', 'google', 'smart city'].map((club) => (
                  <label key={club} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.otherClubs?.includes(club) || false}
                      onChange={() => handleClubChange(club)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="capitalize">{club}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Academic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
              <div className="mb-4">
                <label className="block mb-1">B.Tech CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="academics.btechCGPA"
                  value={formData.academics?.btechCGPA || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full md:w-1/3 border rounded p-2"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1">Education Type</label>
                <select
                  value={selectedEducationType}
                  onChange={handleEducationTypeChange}
                  disabled={!isEditing}
                  className="border rounded p-2"
                >
                  <option value="inter">Inter</option>
                  <option value="diploma">Diploma</option>
                </select>
              </div>

              {selectedEducationType === "inter" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Inter Percentage</label>
                    <input
                      type="number"
                      name="academics.inter.percentage"
                      value={formData.academics?.inter?.percentage ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Board</label>
                    <input
                      type="text"
                      name="academics.inter.board"
                      value={formData.academics?.inter?.board ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Passed Year</label>
                    <input
                      type="number"
                      name="academics.inter.passedYear"
                      value={formData.academics?.inter?.passedYear ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Diploma Percentage</label>
                    <input
                      type="number"
                      name="academics.diploma.percentage"
                      value={formData.academics?.diploma?.percentage ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Board</label>
                    <input
                      type="text"
                      name="academics.diploma.board"
                      value={formData.academics?.diploma?.board ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Passed Year</label>
                    <input
                      type="number"
                      name="academics.diploma.passedYear"
                      value={formData.academics?.diploma?.passedYear ?? ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 w-32">
                <label className="block mb-1">Backlogs</label>
                <input
                  type="number"
                  min="0"
                  name="backlogs"
                  value={formData.backlogs ?? 0}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>

            {/* Dynamic Sections */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const hasEmpty = items.some(emptyCheck);
  return (
    <div className="mb-10">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {items.map((item, idx) => (
        <div key={idx} className="bg-gray-50 border rounded p-4 mb-4 relative">
          {isEditing && (
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="absolute top-1 right-1 text-red-600 font-bold hover:text-red-800"
            >
              ×
            </button>
          )}

          {title === "Projects" && (
            <>
              <label>Title</label>
              <input
                type="text"
                value={item.title || ""}
                onChange={(e) => updateItem("projects", idx, "title", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              <label>Tech Stack (comma separated)</label>
              <input
                type="text"
                value={(item.techStack || []).join(", ")}
                onChange={(e) =>
                  updateItem("projects", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))
                }
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              <label>Description</label>
              <textarea
                value={item.description || ""}
                onChange={(e) => updateItem("projects", idx, "description", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              {["github", "live", "demo"].map((linkKey) => (
                <div key={linkKey}>
                  <label>{linkKey.charAt(0).toUpperCase() + linkKey.slice(1)}</label>
                  <input
                    type="text"
                    value={item.links?.[linkKey] || ""}
                    onChange={(e) => updateLink("projects", idx, linkKey, e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mb-2"
                  />
                </div>
              ))}
              <label>Start Date</label>
              <input
                type="date"
                value={item.startDate ? item.startDate.slice(0, 10) : ""}
                onChange={(e) => updateItem("projects", idx, "startDate", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              <label>End Date</label>
              <input
                type="date"
                value={item.endDate ? item.endDate.slice(0, 10) : ""}
                onChange={(e) => updateItem("projects", idx, "endDate", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
            </>
          )}

          {title === "Internships" && (
            <>
              {["company", "role", "location", "experience"].map((field) => (
                <div key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="text"
                    value={item[field] || ""}
                    onChange={(e) => updateItem("internships", idx, field, e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mb-2"
                  />
                </div>
              ))}
              <label>Tech Stack (comma separated)</label>
              <input
                type="text"
                value={(item.techStack || []).join(", ")}
                onChange={(e) =>
                  updateItem("internships", idx, "techStack", e.target.value.split(",").map((s) => s.trim()))
                }
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              <label>Start Date</label>
              <input
                type="date"
                value={item.startDate ? item.startDate.slice(0, 10) : ""}
                onChange={(e) => updateItem("internships", idx, "startDate", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
              <label>End Date</label>
              <input
                type="date"
                value={item.endDate ? item.endDate.slice(0, 10) : ""}
                onChange={(e) => updateItem("internships", idx, "endDate", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
            </>
          )}

          {title === "Appreciations" && (
            <>
              {["title", "description", "givenBy"].map((field) => (
                <div key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="text"
                    value={item[field] || ""}
                    onChange={(e) => updateItem("appreciations", idx, field, e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mb-2"
                  />
                </div>
              ))}
              <label>Date Received</label>
              <input
                type="date"
                value={item.dateReceived ? item.dateReceived.slice(0, 10) : ""}
                onChange={(e) => updateItem("appreciations", idx, "dateReceived", e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border rounded mb-2"
              />
            </>
          )}

          {title === "Certifications" && (
            <>
              {["name", "issuer", "credentialId", "imageUrl"].map((field) => (
                <div key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="text"
                    value={item[field] || ""}
                    onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mb-2"
                  />
                </div>
              ))}
              {["dateIssued", "expiryDate"].map((field) => (
                <div key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="date"
                    value={item[field] ? item[field].slice(0, 10) : ""}
                    onChange={(e) => updateItem("certifications", idx, field, e.target.value)}
                    disabled={!isEditing}
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
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="text"
                    value={item[field] || ""}
                    onChange={(e) => updateItem("socialLinks", idx, field, e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-2 border rounded mb-2"
                  />
                </div>
              ))}
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        disabled={hasEmpty || !isEditing}
        className={`text-purple-700 font-semibold ${
          hasEmpty || !isEditing ? "opacity-50 cursor-not-allowed" : "hover:text-purple-900"
        }`}
      >
        + Add {title.slice(0, -1)}
      </button>
    </div>
  );
}

export default StudentProfile;