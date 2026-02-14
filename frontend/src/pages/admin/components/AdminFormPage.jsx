import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../../../components/common/Header";
import ToastNotification from "../../../components/ui/ToastNotification";

const AdminFormPage = ({ title, subtitle, fields, onSubmit, submitLabel = "Submit" }) => {
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");

  const [formData, setFormData] = useState(() => {
    const initial = {};
    fields.forEach((f) => (initial[f.name] = f.defaultValue || ""));
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        showToast("success", result.message);
        const reset = {};
        fields.forEach((f) => (reset[f.name] = f.defaultValue || ""));
        setFormData(reset);
        setTimeout(() => navigate("/admin-dashboard"), 3000);
      } else {
        showToast("error", result.message || "Something went wrong");
      }
    } catch {
      showToast("error", "Request failed");
    }
    setLoading(false);
  };

  const renderField = (field) => {
    return (
      <div key={field.name}>
        <label htmlFor={field.name} className="block text-xs font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.type === "select" ? (
          <select
            id={field.name}
            name={field.name}
            required={field.required}
            value={formData[field.name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.name}
            type={field.type || "text"}
            name={field.name}
            required={field.required}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            min={field.min}
            maxLength={field.maxLength}
            className="w-full px-3 py-2 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title={title}
        subtitle={subtitle}
        showTitleInHeader={false}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => navigate("/admin-dashboard")}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 pt-24 w-full">
        {toast && (
          <div className="max-w-5xl mx-auto mb-4">
            <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sm sm:text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((f) => renderField(f))}
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard")}
                  disabled={loading}
                  className="px-4 py-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminFormPage;
