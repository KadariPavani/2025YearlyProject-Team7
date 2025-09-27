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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [selectedEducationType, setSelectedEducationType] = useState("inter");

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getProfile("student");
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
        setSelectedEducationType(response.data.data.academics?.educationType || "inter");
      } else {
        setError(response.data.message || "Failed to fetch profile");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch profile");
      if (err?.response?.status === 401) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
        navigate("/student-login");
      }
    } finally {
      setLoading(false);
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

  const addItemToArray = (field, defaultValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] ? [...prev[field], defaultValue] : [defaultValue],
    }));
  };

  const removeItemFromArray = (field, idx) => {
    setFormData((prev) => {
      const arr = prev[field] ? [...prev[field]] : [];
      arr.splice(idx, 1);
      return { ...prev, [field]: arr };
    });
  };

  const updateItemInArray = (field, idx, key, val) => {
    setFormData((prev) => {
      const arr = prev[field] ? [...prev[field]] : [];
      const item = { ...arr[idx] };
      item[key] = val;
      arr[idx] = item;
      return { ...prev, [field]: arr };
    });
  };

  const updateLinkInArray = (field, idx, linkKey, val) => {
    setFormData((prev) => {
      const arr = prev[field] ? [...prev[field]] : [];
      const item = { ...arr[idx] };
      item.links = { ...(item.links || {}), [linkKey]: val };
      arr[idx] = item;
      return { ...prev, [field]: arr };
    });
  };

  const hasEmptyItem = (field, checker) => (formData[field] || []).some(checker);

  const uploadProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataUpload = new FormData();
    formDataUpload.append("profileImage", file);
    setUploadingImage(true);
    try {
      const res = await fetch("/api/student/profile-image", {
        method: "POST",
        body: formDataUpload,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, profileImageUrl: data.data }));
        setSuccess("Profile image uploaded successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Image upload failed");
      }
    } catch (error) {
      setError("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await updateProfile("student", formData);
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
        setSuccess("Profile updated successfully");
        setTimeout(() => setSuccess(""), 3000);
        setIsEditing(false);
      } else {
        setError(response.data.message || "Failed to update profile");
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError("");
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
      src={formData.profileImageUrl}  // Use Cloudinary absolute URL directly
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
                  className="mb-4"
                />
              )}

              <h2 className="text-xl font-semibold text-gray-900 mb-2">{profile?.name || "Student Name"}</h2>
              <p className="text-gray-600 mb-4">{profile?.rollNo || "Roll Number"}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <GraduationCap className="h-4 w-4" />
                <span>{profile?.college || "College"}</span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 overflow-auto max-h-[80vh]">
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

            {/* Education */}
            <div className="mb-6">
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
              <>
                <input
                  type="number"
                  placeholder="Inter Percentage"
                  name="academics.inter.percentage"
                  value={formData.academics?.inter?.percentage ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
                <input
                  type="text"
                  placeholder="Inter Board"
                  name="academics.inter.board"
                  value={formData.academics?.inter?.board ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
                <input
                  type="number"
                  placeholder="Inter Passed Year"
                  name="academics.inter.passedYear"
                  value={formData.academics?.inter?.passedYear ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
              </>
            ) : (
              <>
                <input
                  type="number"
                  placeholder="Diploma Percentage"
                  name="academics.diploma.percentage"
                  value={formData.academics?.diploma?.percentage ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
                <input
                  type="text"
                  placeholder="Diploma Board"
                  name="academics.diploma.board"
                  value={formData.academics?.diploma?.board ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
                <input
                  type="number"
                  placeholder="Diploma Passed Year"
                  name="academics.diploma.passedYear"
                  value={formData.academics?.diploma?.passedYear ?? ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="border p-2 rounded mb-2 w-full md:w-1/3"
                />
              </>
            )}

            {/* Backlogs */}
            <div className="mb-6 w-32">
              <label>Backlogs</label>
              <input
                type="number"
                name="backlogs"
                value={formData.backlogs ?? 0}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Dynamic Arrays */}
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
