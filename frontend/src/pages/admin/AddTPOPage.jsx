import React from "react";
import { User, Mail, Phone, Briefcase, Linkedin } from "lucide-react";
import AdminFormPage from "./components/AdminFormPage";

const fields = [
  { name: "name", label: "Full Name", type: "text", icon: User, required: true, placeholder: "Enter name" },
  { name: "email", label: "Email Address", type: "email", icon: Mail, required: true, placeholder: "Enter email" },
  { name: "phone", label: "Phone Number", type: "tel", icon: Phone, required: true, placeholder: "10-digit phone", maxLength: 10 },
  { name: "experience", label: "Experience (Years)", type: "number", icon: Briefcase, required: false, placeholder: "Years of experience", min: 0 },
  { name: "linkedIn", label: "LinkedIn Profile", type: "url", icon: Linkedin, required: false, placeholder: "LinkedIn URL" },
];

const handleSubmit = async (formData) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/add-tpo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({
        ...formData,
        experience: parseInt(formData.experience) || 0,
      }),
    }
  );
  const result = await res.json();
  return {
    success: result.success,
    message: result.success
      ? "TPO added successfully! Credentials sent to their email."
      : result.message || "Failed to add TPO",
  };
};

const AddTPOPage = () => (
  <AdminFormPage
    title="Add TPO"
    fields={fields}
    onSubmit={handleSubmit}
    submitLabel="Add TPO"
  />
);

export default AddTPOPage;
