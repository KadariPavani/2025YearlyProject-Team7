import React from "react";
import { Mail, UserCog } from "lucide-react";
import AdminFormPage from "./components/AdminFormPage";

const AdminLevels = [
  { value: "super_admin", label: "Super Admin (All Access)" },
  { value: "admin_level_1", label: "Admin Level 1 (Add Trainer/TPO/Activity)" },
  { value: "admin_level_2", label: "Admin Level 2 (Add Trainer/Activity)" },
  { value: "admin_level_3", label: "Admin Level 3 (View Activity Only)" },
];

const fields = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    icon: Mail,
    required: true,
    placeholder: "Enter admin email",
  },
  {
    name: "role",
    label: "Admin Role & Permissions",
    type: "select",
    icon: UserCog,
    required: true,
    defaultValue: "admin_level_3",
    options: AdminLevels,
  },
];

const handleSubmit = async (formData) => {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/add-admin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: formData.email, role: formData.role }),
    }
  );
  const data = await res.json();
  return {
    success: data.success,
    message: data.success
      ? "Admin added successfully! Login credentials sent via email."
      : data.message || "Failed to add admin",
  };
};

function AddAdmin() {
  return (
    <AdminFormPage
      title="Add Admin"
      subtitle="Create admin profile"
      fields={fields}
      onSubmit={handleSubmit}
      submitLabel="Add Admin"
    />
  );
}

export default AddAdmin;
