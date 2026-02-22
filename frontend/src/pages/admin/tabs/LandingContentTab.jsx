import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Image,
  HelpCircle,
  Eye,
  EyeOff,
  Loader2,
  Upload,
} from "lucide-react";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeletons";
import ToastNotification from "../../../components/ui/ToastNotification";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SUB_TABS = [
  { id: "hero", label: "Hero Slides", icon: Image },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
];

// ─────────────────────── Modal Component ───────────────────────
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────── Main Component ───────────────────────
const LandingContentTab = () => {
  const [subTab, setSubTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Data
  const [heroSlides, setHeroSlides] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingItem, setEditingItem] = useState(null);

  // Form data
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/landing-content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setHeroSlides(json.data.heroSlides || []);
        setFaqs(json.data.faqs || []);
      }
    } catch (err) {
      console.error("Error fetching landing content:", err);
      showToast?.("error", "Failed to load landing content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ────── Generic API call ──────
  const apiRequest = async (url, method, body, isFormData = false) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (!isFormData) headers["Content-Type"] = "application/json";

      const res = await fetch(`${API_BASE}${url}`, {
        method,
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API error");
      return json;
    } catch (err) {
      showToast?.("error", err.message || "Network error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ────── Modal helpers ──────
  const openAddModal = (type) => {
    setModalMode("add");
    setEditingItem(null);
    setImageFile(null);
    setImagePreview(null);

    if (type === "hero") setFormData({ title: "", description: "", buttonText: "", buttonUrl: "", order: heroSlides.length, isActive: true });
    else if (type === "faqs") setFormData({ question: "", answer: "", order: faqs.length, isActive: true });

    setModalOpen(true);
  };

  const openEditModal = (type, item) => {
    setModalMode("edit");
    setEditingItem(item);
    setImageFile(null);
    setImagePreview(null);

    if (type === "hero") {
      setFormData({ title: item.title, description: item.description, buttonText: item.buttonText || "", buttonUrl: item.buttonUrl || "", order: item.order, isActive: item.isActive });
      setImagePreview(item.imageUrl);
    } else if (type === "faqs") {
      setFormData({ question: item.question, answer: item.answer, order: item.order, isActive: item.isActive });
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
    setImageFile(null);
    setImagePreview(null);
  };

  // ────── Image handler ──────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ────── Submit handler ──────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine API path and whether we need FormData
    let url, method;
    const needsImage = subTab === "hero";

    if (subTab === "hero") {
      url = modalMode === "add"
        ? "/api/admin/landing-content/hero-slides"
        : `/api/admin/landing-content/hero-slides/${editingItem._id}`;
    } else if (subTab === "faqs") {
      url = modalMode === "add"
        ? "/api/admin/landing-content/faqs"
        : `/api/admin/landing-content/faqs/${editingItem._id}`;
    }

    method = modalMode === "add" ? "POST" : "PUT";

    let body, isFormData = false;

    if (needsImage) {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
      if (imageFile) fd.append("image", imageFile);
      else if (modalMode === "add") {
        showToast?.("error", "Image is required");
        return;
      }
      body = fd;
      isFormData = true;
    } else {
      body = formData;
    }

    const result = await apiRequest(url, method, body, isFormData);
    if (result) {
      showToast?.("success", `${modalMode === "add" ? "Added" : "Updated"} successfully`);
      closeModal();
      fetchData();
    }
  };

  // ────── Delete handler ──────
  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    let url;
    if (type === "hero") url = `/api/admin/landing-content/hero-slides/${id}`;
    else if (type === "faqs") url = `/api/admin/landing-content/faqs/${id}`;

    const result = await apiRequest(url, "DELETE");
    if (result) {
      showToast?.("success", "Deleted successfully");
      fetchData();
    }
  };

  // ────── Toggle active handler ──────
  const handleToggleActive = async (type, item) => {
    let url;
    if (type === "hero") url = `/api/admin/landing-content/hero-slides/${item._id}`;
    else if (type === "faqs") url = `/api/admin/landing-content/faqs/${item._id}`;

    const result = await apiRequest(url, "PUT", { isActive: !item.isActive });
    if (result) {
      showToast?.("success", `${item.isActive ? "Deactivated" : "Activated"} successfully`);
      fetchData();
    }
  };

  // ────── Loading state ──────
  if (loading) {
    return <LoadingSkeleton />;
  }

  // ────── Render ──────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
          Landing Page Content
        </h3>
        <button
          onClick={() => openAddModal(subTab)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">
            Add {subTab === "hero" ? "Slide" : "FAQ"}
          </span>
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                subTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Hero Slides Section ─── */}
      {subTab === "hero" && (
        <div className="space-y-4">
          {heroSlides.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hero slides yet. Click "Add Slide" to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {heroSlides.sort((a, b) => a.order - b.order).map((slide) => (
                <div
                  key={slide._id}
                  className={`flex flex-col sm:flex-row items-start gap-4 p-4 rounded-lg border ${
                    slide.isActive ? "border-gray-200 bg-white" : "border-orange-200 bg-orange-50 opacity-70"
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full sm:w-36 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{slide.title}</h4>
                      {!slide.isActive && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{slide.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {slide.buttonText ? `Button: ${slide.buttonText}` : 'No button'} · Order: {slide.order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive("hero", slide)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={slide.isActive ? "Deactivate" : "Activate"}
                    >
                      {slide.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEditModal("hero", slide)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete("hero", slide._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── FAQs Section ─── */}
      {subTab === "faqs" && (
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No FAQs yet. Click "Add FAQ" to get started.</p>
            </div>
          ) : (
            faqs.sort((a, b) => a.order - b.order).map((faq) => (
              <div
                key={faq._id}
                className={`p-4 rounded-lg border ${
                  faq.isActive ? "border-gray-200 bg-white" : "border-orange-200 bg-orange-50 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                      {!faq.isActive && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                    <p className="text-xs text-gray-400 mt-1">Order: {faq.order}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive("faqs", faq)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={faq.isActive ? "Deactivate" : "Activate"}
                    >
                      {faq.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEditModal("faqs", faq)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete("faqs", faq._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Add / Edit Modal ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={`${modalMode === "add" ? "Add" : "Edit"} ${
          subTab === "hero" ? "Hero Slide" : "FAQ"
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hero Slide Form */}
          {subTab === "hero" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. Welcome to KIET"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={formData.buttonText || ""}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Leave empty for no button"
                />
              </div>
              {formData.buttonText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                  <input
                    type="url"
                    value={formData.buttonUrl || ""}
                    onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="https://example.com/page"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image {modalMode === "add" ? "*" : "(leave empty to keep current)"}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageFile && <span className="text-xs text-gray-500">{imageFile.name}</span>}
                </div>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg border"
                  />
                )}
              </div>
            </>
          )}

          {/* FAQ Form */}
          {subTab === "faqs" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  value={formData.question || ""}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. How to register as a student?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <textarea
                  value={formData.answer || ""}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Detailed answer..."
                />
              </div>
            </>
          )}

          {/* Common: Order + Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order ?? 0}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                min={0}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {modalMode === "add" ? "Add" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default LandingContentTab;
