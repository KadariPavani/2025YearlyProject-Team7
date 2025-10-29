import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GetInTouch from "../components/common/GetInTouch";
import Footer from "../components/common/Footer";

const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 🔙 Back to Home Button */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 py-3 px-4 flex items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Contact Section */}
      <main className="flex-1 pt-16 pb-10">
        <GetInTouch />
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ContactPage;
