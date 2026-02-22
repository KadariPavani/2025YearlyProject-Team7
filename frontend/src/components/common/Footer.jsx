import { useNavigate } from "react-router-dom";
import { FaLinkedin, FaInstagram, FaGithub } from "react-icons/fa";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-gray-100 text-gray-800 py-8 sm:py-10 mt-auto border-t border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 items-start">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-2">
            <img
              src="/IFlogo.png"
              alt="InfoVerse Logo"
              className="h-12 w-12 sm:h-16 sm:w-16 object-contain cursor-pointer mb-2 sm:mb-3"
              onClick={() => navigate("/")}
            />
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-xs">
              INFOVERSE is KIET's all-in-one Training & Placement Management System. It manages student profiles, training schedules, placement drives, contests, learning resources, and real-time notifications — all in one place.
            </p>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-3 sm:mt-4">Powered by KHUB Team-07 &mdash; 2025-26</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="/#home" className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">Home</a></li>
              <li><a href="/#placements" className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">Placements</a></li>
              <li><a href="/#students" className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">Placed Students</a></li>
              <li><a href="/#faqs" className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">FAQs</a></li>
              <li>
                <button onClick={() => navigate("/contact")} className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">Portals</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <button onClick={() => navigate("/student-login")} className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">
                  Student Portal
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/trainer-login")} className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">
                  Trainer Portal
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/coordinator-login")} className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">
                  Coordinator Portal
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/tpo-login")} className="text-xs sm:text-sm text-gray-600 hover:text-[#5791ED] transition-colors">
                  TPO Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3">Contact</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="tel:+919347132534" className="flex items-start gap-1.5 sm:gap-2 hover:text-[#5791ED] transition-colors">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0 text-[#5791ED]" />
                  <span className="text-xs sm:text-sm text-gray-600">+91 9347132534</span>
                </a>
              </li>
              <li>
                <a href="mailto:kadaripavani1@gmail.com" className="flex items-start gap-1.5 sm:gap-2 hover:text-[#5791ED] transition-colors">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0 text-[#5791ED]" />
                  <span className="text-xs sm:text-sm text-gray-600 break-all">kadaripavani1@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0 text-[#5791ED]" />
                <span className="text-xs sm:text-sm text-gray-600">Kakinada, Andhra Pradesh, India</span>
              </li>
            </ul>

            <div className="flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
              <a href="https://www.instagram.com/kiet.channel?igsh=MjhvYzNsenU0Z3Ax" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#5791ED] transition-colors"><FaInstagram size={14} className="sm:w-4 sm:h-4" /></a>
              <a href="https://www.linkedin.com/school/kakinada-institute-of-engineering-and-technology/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#5791ED] transition-colors"><FaLinkedin size={14} className="sm:w-4 sm:h-4" /></a>
              <a href="https://github.com/KadariPavani/2025YearlyProject-Team7.git" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#5791ED] transition-colors"><FaGithub size={14} className="sm:w-4 sm:h-4" /></a>
            </div>
          </div>

        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-[11px] sm:text-xs text-gray-400">&copy; {new Date().getFullYear()} INFOVERSE &mdash; KIET. All rights reserved.</p>
          <p className="text-[11px] sm:text-xs text-gray-400">KHUB Team-07 2025-26 &mdash; Kakinada, Andhra Pradesh</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
