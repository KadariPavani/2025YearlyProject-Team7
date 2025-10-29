import { FaLinkedin, FaTwitter, FaGithub, FaInstagram, FaFacebookF } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-800 py-8 mt-auto border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 items-start">
          
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
                            <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Super Admin Login"
              >
                <img
                  src="/Logo.png"
                  alt="InfoVerse Logo"
                  className="h-20 w-20 object-contain cursor-pointer centered"
                />
              </button>

              {/* <div className="w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm">
                <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12L14 2H20L10 12L20 22H14L4 12Z" fill="#5B8CFF"/>
                </svg>
              </div> */}
              {/* <div>
                <h3 className="text-xl font-bold tracking-wide">INFOVERSE</h3>
                <p className="text-sm text-gray-600">Empowering Your Career</p>
              </div> */}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              INFOVERSE is the premier platform for placements and career guidance.  
              We provide students with the latest updates on companies, interview tips, training sessions, and success stories to help them achieve their dream jobs.
            </p>

            <p className="text-xs text-gray-500 mt-4">INFOVERSE Powered by Metis Eduventures Private Limited</p>
          </div>

          {/* Support Us */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-indigo-600">Contact Us</a></li>
              <li><a href="#" className="hover:text-indigo-600">About INFOVERSE</a></li>
              <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-600">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-indigo-600">Feedback</a></li>
            </ul>
          </div>

          {/* Companies */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Companies</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-indigo-600">TCS</a></li>
              <li><a href="#" className="hover:text-indigo-600">Infosys</a></li>
              <li><a href="#" className="hover:text-indigo-600">Wipro</a></li>
              <li><a href="#" className="hover:text-indigo-600">Accenture</a></li>
              <li><a href="#" className="hover:text-indigo-600">Cognizant</a></li>
              <li><a href="#" className="hover:text-indigo-600">Amazon</a></li>
              <li><a href="#" className="hover:text-indigo-600">Other Partner Companies</a></li>
            </ul>
          </div>

          {/* Dashboards */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Dashboards</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-indigo-600">Student Dashboard</a></li>
              <li><a href="#" className="hover:text-indigo-600">Trainer Dashboard</a></li>
              <li><a href="#" className="hover:text-indigo-600">Placement Dashboard</a></li>
              <li><a href="#" className="hover:text-indigo-600">Admin Dashboard</a></li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Get in Touch</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li>Email: <span className="text-gray-800 font-medium">info@infoverse.com</span></li>
              <li><a href="#" className="hover:text-indigo-600">Instagram</a></li>
              <li><a href="#" className="hover:text-indigo-600">Twitter</a></li>
              <li><a href="#" className="hover:text-indigo-600">LinkedIn</a></li>
              <li><a href="#" className="hover:text-indigo-600">Facebook</a></li>
            </ul>

            <div className="flex items-center space-x-3 mt-3">
              <a href="#" className="text-gray-600 hover:text-indigo-600"><FaInstagram /></a>
              <a href="#" className="text-gray-600 hover:text-indigo-600"><FaTwitter /></a>
              <a href="#" className="text-gray-600 hover:text-indigo-600"><FaLinkedin /></a>
              <a href="#" className="text-gray-600 hover:text-indigo-600"><FaFacebookF /></a>
              <a href="#" className="text-gray-600 hover:text-indigo-600"><FaGithub /></a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between">
          <p>&copy; {new Date().getFullYear()} INFOVERSE. All rights reserved.</p>
          <p className="mt-2 md:mt-0">INFOVERSE
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
