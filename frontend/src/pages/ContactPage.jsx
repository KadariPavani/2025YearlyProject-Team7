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
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => navigate("/super-admin-login")}
                aria-label="Super Admin Login"
              >
                <img
                  src="/Logo.png"
                  alt="InfoVerse Logo"
                  className="h-16 w-16 object-contain cursor-pointer"
                />
              </button>
              {/* <span className="text-gray-900 font-bold text-lg sm:text-xl">
                INFOVERSE
              </span> */}
            </div>
          </div>
        </div>
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
