import React from "react";
import { User, Mail, Phone, BadgePercent, Briefcase, Linkedin, Book, Tag } from "lucide-react";
import AdminFormPage from "./components/AdminFormPage";

const fields = [
  { name: "name", label: "Full Name", type: "text", icon: User, required: true, placeholder: "Enter full name" },
  { name: "email", label: "Email Address", type: "email", icon: Mail, required: true, placeholder: "Enter email address" },
  { name: "phone", label: "Phone Number", type: "tel", icon: Phone, required: true, placeholder: "10-digit phone", maxLength: 10 },
  { name: "employeeId", label: "Employee ID", type: "text", icon: BadgePercent, required: true, placeholder: "Enter employee ID" },
  { name: "experience", label: "Experience (Years)", type: "number", icon: Briefcase, required: false, placeholder: "Years of experience", min: 0 },
  { name: "linkedIn", label: "LinkedIn Profile", type: "url", icon: Linkedin, required: false, placeholder: "LinkedIn profile URL" },
  { name: "subjectDealing", label: "Subject Specialization", type: "text", icon: Book, required: true, placeholder: "e.g. Python, Data Science" },
  {
    name: "category",
    label: "Category",
    type: "select",
    icon: Tag,
    required: true,
    defaultValue: "",
    options: [
      { value: "", label: "Select trainer category" },
      { value: "technical", label: "Technical" },
      { value: "non-technical", label: "Non-Technical" },
    ],
  },
];

const handleSubmit = async (formData) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/add-trainer`,
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
      ? "Trainer added successfully! Credentials sent to their email."
      : result.message || "Failed to add trainer",
  };
};

const AddTrainerPage = () => (
  <AdminFormPage
    title="Add Trainer"
    fields={fields}
    onSubmit={handleSubmit}
    submitLabel="Add Trainer"
  />
);

export default AddTrainerPage;
