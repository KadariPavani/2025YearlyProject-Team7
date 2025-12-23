import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  LogIn,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import HighlightTicker from "../components/common/HighlightTicker";
import HeroCarousel from "../components/common/HeroCarousel";
import Placements from "../components/common/Placements";
import PlacedStudents from "../components/common/PlacedStudents";
import FAQSection from "../components/common/FAQSection";
import Footer from "../components/common/Footer";

import "../styles/globals.css";

const Landing = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userTypes = [
    { name: "TPO", icon: Users, path: "/tpo-login", color: "text-blue-600", bgColor: "bg-blue-600" },
    { name: "Trainer", icon: BookOpen, path: "/trainer-login", color: "text-green-600", bgColor: "bg-green-600" },
    { name: "Student", icon: GraduationCap, path: "/student-login", color: "text-purple-600", bgColor: "bg-purple-600" },
    { name: "Coordinator", icon: UserCheck, path: "/coordinator-login", color: "text-orange-600", bgColor: "bg-orange-600" },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🎞 Animation only for PlacedStudents section
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 scroll-smooth">
      {/* Header */}
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
                  src="/IFlogo.png"
                  alt="InfoVerse Logo"
                  className="h-16 w-16 object-contain cursor-pointer"
                />
              </button>
              {/* <span className="text-gray-900 font-bold text-lg sm:text-xl">
                INFOVERSE
              </span> */}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 text-gray-800 font-medium">
              <a href="#home" className="hover:text-indigo-600">Home</a>
              <a href="#placements" className="hover:text-indigo-600">Placements</a>
              <a href="#students" className="hover:text-indigo-600">Students</a>
              <a href="#faqs" className="hover:text-indigo-600">FAQ</a>
              <button
                onClick={() => navigate("/contact")}
                className="hover:text-indigo-600"
              >
                Contact
              </button>
            </nav>

            {/* Right: Login dropdown (desktop) */}
            <div className="hidden md:flex items-center" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown((s) => !s)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium">Login</span>
                  <ChevronDown
                    className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-fadeIn">
                    {userTypes.map((type, index) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(type.path);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 transition-all duration-200 text-sm sm:text-base"
                        >
                          <div className={`p-2 rounded-lg ${type.bgColor} bg-opacity-10`}>
                            <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${type.color}`} />
                          </div>
                          <span className="font-medium">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="block md:hidden text-gray-800 focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* Page sections start here */}
      <main className="flex-1 pt-20">
        <HighlightTicker />
        <HeroCarousel />

        {/* Placements section */}
        <section id="placements">
          <h2 className="text-2xl font-semibold text-center mt-6 mb-4">
          </h2>
          <Placements />
        </section>

        {/* PlacedStudents section with animation */}
        <motion.section
          id="students"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
        >
          <PlacedStudents />
        </motion.section>

        {/* FAQ section */}
        <section id="faqs">
          <FAQSection />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;