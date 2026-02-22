import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GetInTouch from "../components/common/GetInTouch";
import Footer from "../components/common/Footer";

const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Home"
            >
              <img
                src="/IFlogo.png"
                alt="InfoVerse Logo"
                className="h-12 w-12 sm:h-16 sm:w-16 object-contain cursor-pointer"
              />
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-[#5791ED] transition-colors"
            >
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 sm:pt-20">
        <GetInTouch />
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
