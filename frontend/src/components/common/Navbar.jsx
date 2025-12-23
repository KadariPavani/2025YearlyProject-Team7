
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        <div className="flex items-center space-x-2">

          <img src="/IFlogo.png" alt="Infoverse Logo" className="h-10" />
          <span className="text-gray-900 font-bold text-lg">INFOVERSE</span>
        </div>

        <nav className="hidden md:flex">
          <ul className="flex space-x-6 font-medium text-gray-900">
            <li><a href="#home" className="hover:text-gray-600 transition">Home</a></li>
            <li><a href="#placements" className="hover:text-gray-600 transition">Company’s</a></li>
            <li><a href="#students" className="hover:text-gray-600 transition">Placed Students</a></li>
            <li><a href="#faqs" className="hover:text-gray-600 transition">FAQ</a></li>
            <li><a href="#contact" className="hover:text-gray-600 transition">Contact Us</a></li>
          </ul>
        </nav>

        <button
          onClick={() => navigate("/login")}
          className="hidden md:block bg-[#5791ED] px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-700 transition"
        >
          Login
        </button>

        <button
          className="md:hidden text-gray-900 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden shadow-lg bg-white animate-slideDown">
          <ul className="flex flex-col items-center space-y-4 py-6 font-medium text-gray-900">
            <li><a href="#home" onClick={() => setMenuOpen(false)} className="hover:text-gray-600 transition">Home</a></li>
            <li><a href="#placements" onClick={() => setMenuOpen(false)} className="hover:text-gray-600 transition">Company’s</a></li>
            <li><a href="#students" onClick={() => setMenuOpen(false)} className="hover:text-gray-600 transition">Placed Students</a></li>
            <li><a href="#faqs" onClick={() => setMenuOpen(false)} className="hover:text-gray-600 transition">FAQ</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-gray-600 transition">Contact Us</a></li>
            <li>
              <button
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
                className="bg-[#5791ED] px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-700 transition w-[150px]">
                Login
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
