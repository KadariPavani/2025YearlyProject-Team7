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
  Home,
  Building2,
  MessageSquare,
  HelpCircle,
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
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const loginOptionsRef = useRef(null);

  const userTypes = [
    { name: "TPO", icon: Users, path: "/tpo-login", color: "text-blue-600", bgColor: "bg-blue-600" },
    { name: "Trainer", icon: BookOpen, path: "/trainer-login", color: "text-green-600", bgColor: "bg-green-600" },
    { name: "Student", icon: GraduationCap, path: "/student-login", color: "text-purple-600", bgColor: "bg-purple-600" },
    { name: "Coordinator", icon: UserCheck, path: "/coordinator-login", color: "text-orange-600", bgColor: "bg-orange-600" },
  ];

  const navItems = [
    { name: "Home", icon: Home, href: "#home", color: "text-indigo-600", bgColor: "bg-indigo-600" },
    { name: "Placements", icon: Building2, href: "#placements", color: "text-blue-600", bgColor: "bg-blue-600" },
    { name: "Students", icon: GraduationCap, href: "#students", color: "text-purple-600", bgColor: "bg-purple-600" },
    { name: "FAQ", icon: HelpCircle, href: "#faqs", color: "text-green-600", bgColor: "bg-green-600" },
    { name: "Contact", icon: MessageSquare, path: "/contact", color: "text-orange-600", bgColor: "bg-orange-600" },
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

  // Close mobile menu when resizing to desktop view
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
        setMobileLoginOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🎞 Animation only for PlacedStudents section
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 scroll-smooth w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuOpen(false)}>
          <div 
            className="fixed top-[72px] left-0 right-0 bottom-0 bg-white shadow-lg z-50 animate-slideDown flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={scrollContainerRef} className="flex-1 py-4 px-4 overflow-y-auto scroll-smooth">
              {/* Navigation Items */}
              <div className="mb-4">
                {navItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
                        } else if (item.href) {
                          document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-lg"
                    >
                      <div className={`p-2 rounded-lg ${item.bgColor} bg-opacity-10`}>
                        <IconComponent className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <span className="font-medium text-base">{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Login Options - Show only when mobileLoginOpen is true - displayed above */}
              {mobileLoginOpen && (
                <div ref={loginOptionsRef} className="space-y-2 mb-4 animate-slideUp">
                  <div className="border-t border-gray-200 mb-4"></div>
                  <p className="px-4 text-sm font-semibold text-gray-500 mb-2">Login As</p>
                  {userTypes.map((type, index) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(type.path);
                          setMenuOpen(false);
                          setMobileLoginOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 transition-all duration-200 rounded-lg border border-transparent hover:border-indigo-200"
                      >
                        <div className={`p-2 rounded-lg ${type.bgColor} bg-opacity-10`}>
                          <IconComponent className={`h-5 w-5 ${type.color}`} />
                        </div>
                        <span className="font-medium text-base">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Login Button at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  const newState = !mobileLoginOpen;
                  setMobileLoginOpen(newState);
                  if (newState && scrollContainerRef.current && loginOptionsRef.current) {
                    setTimeout(() => {
                      loginOptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium text-base">Login</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    mobileLoginOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

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