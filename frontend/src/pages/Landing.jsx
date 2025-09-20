import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/common/Footer";
import "../styles/globals.css"; // Corrected path



// Slides data
const slides = [
  {
    title: "Your Education Everywhere You Are",
    desc: "Any successful career starts with good education.",
    img: "/campus.jpg",
    btnText: "Know More",
  },
  {
    title: "Placements 2025 Are Live!",
    desc: "Top companies are hiring talented graduates.",
    img: "/slide2.jpg",
    btnText: "Explore Jobs",
  },
  {
    title: "Training Sessions Open",
    desc: "Upskill with our expert-led training programs.",
    img: "/slide3.jpg",
    btnText: "Join Now",
  },
  {
    title: "Alumni Connect",
    desc: "Build your network with successful alumni.",
    img: "/slide4.jpg",
    btnText: "Connect",
  },
];

// Placed Students
const placedStudents = [
  { name: "Sarika Chikkam", role: "AI Engineer", location: "Hyderabad", img: "/student1.jpg" },
  { name: "Karthik Reddy", role: "System Engineer", location: "Bangalore", img: "/student2.jpg" },
  { name: "Soujanya", role: "System Engineer", location: "Hyderabad", img: "/student3.jpg" },
];

// Alumni
const alumni = [
  { name: "Durga Bhavani Gunnam", year: "2021", location: "Hyderabad", role: "Full Stack Developer", img: "/alumni1.jpg" },
  { name: "Harsha Vardhan", year: "2022", location: "Bangalore", role: "Web Developer", img: "/alumni2.jpg" },
  { name: "Shanmukha", year: "2023", location: "Hyderabad", role: "Full Stack Developer", img: "/alumni3.jpg" },
];

// FAQ
const faqs = [
  { q: "How To Register As A Student", a: "Students can register by signing up with their details. After verification, they will get access to their personalized dashboard." },
  { q: "How To Apply For Placements", a: "Eligible students will see the event in the Company Updates section of their dashboard and can apply directly from there." },
  { q: "How To Update My Profile", a: "Login → Profile Settings → Add details like CGPA, Projects, Certifications, Resume, LinkedIn, GitHub, etc." },
  { q: "How To Access Training Materials", a: "Trainers upload study materials, assignments, and quizzes to the platform. Students can access them under the ‘Resources’ section." },
  { q: "How To Mark Attendance", a: "Student coordinators can mark presence via Attendance Dashboard. This reflects in student reports." },
  { q: "How To Connect With Alumni", a: "Use the Alumni Connect feature to search alumni based on skills, companies, or location." },
];

const HighlightTicker = () => {
  const highlights = [
    "⭐ Placements 2025 Are Live!",
    "⭐ Training Sessions Open for All Students",
    "⭐ New Courses Available Now",
    "⭐ Join Our Alumni Connect Today",
    "⭐ Placement Assistance Available",
  ];

  return (
    <div className="flex items-center px-2 py-1">
      <button className="bg-blue-500 text-white px-10 py-2 rounded-l-md font-medium">
        Highlights
      </button>
      <div className="overflow-hidden flex-1">
        <div className="inline-block animate-marquee ml-4">
          {highlights.map((text, i) => (
            <span key={i} className="mr-12 text-gray-800 font-medium">{text}</span>
          ))}
          {highlights.map((text, i) => (
            <span key={i + highlights.length} className="mr-12 text-gray-800 font-medium">{text}</span>
          ))}
        </div>
      </div>
    </div>
  );
};



const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  // Auto slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-gradient-to-r from-blue-300 to-blue-500 shadow-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center space-x-2">
            <img src="/Logo.png" alt="Infoverse Logo" className="h-10" />
            <span className="text-white font-bold text-lg">INFOVERSE</span>
          </div>
          <nav>
            <ul className="hidden md:flex space-x-6 text-white font-medium">
              {["Home", "Company’s", "Placed Students", "College Alumni", "Contact Us"].map((item, i) => (
                <li key={i}><a href="#">{item}</a></li>
              ))}
            </ul>
          </nav>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-500 px-4 py-2 rounded-lg text-white font-medium hover:bg-red-600 transition"
          >
            Login
          </button>
        </div>
      </header>

      {/* Highlight Ticker */}
      <div className="pt-16">
        <HighlightTicker />
      </div>

      {/* Hero Carousel */}
      <main className="relative flex-1 pt-6">
        <div className="relative w-full h-[700px] overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={slide.img} alt={slide.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-start px-10 text-white">
                <h1 className="text-3xl md:text-5xl font-bold">{slide.title}</h1>
                <p className="mt-4 text-lg">{slide.desc}</p>
                <button className="mt-6 bg-orange-500 px-5 py-2 rounded-md hover:bg-orange-600 transition">
                  {slide.btnText}
                </button>
              </div>
            </div>
          ))}

          {/* Arrows */}
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-5 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80"
          >
            ❮
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-5 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80"
          >
            ❯
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 w-full flex justify-center space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${currentSlide === index ? "bg-white" : "bg-gray-400"}`}
              ></button>
            ))}
          </div>
        </div>
      </main>

      {/* Placements */}
      {/* ...rest of your placements, alumni, FAQ, contact, footer sections remain unchanged... */}

      <Footer />
    </div>
  );
};
      
      {/* Placements */}
      <section className="py-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-8">PLACEMENTS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {["infosys.png", "tcs.png", "wipro.png", "hcl.png", "ibm.png", "dell.png"].map((logo, i) => (
            <img key={i} src={`/${logo}`} alt={`${logo} logo`} className="h-12 mx-auto" />
          ))}
        </div>

        <h3 className="text-2xl font-semibold mt-12 mb-6">Recently Placed Students</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {placedStudents.map((s, i) => (
            <div key={i} className="bg-white shadow-md rounded-lg p-6 w-64">
              <img src={s.img} alt={s.name} className="h-32 w-32 mx-auto rounded-full object-cover" />
              <h4 className="mt-4 font-semibold">{s.name}</h4>
              <p className="text-gray-600 text-sm">Role: {s.role}</p>
              <p className="text-gray-600 text-sm">Location: {s.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alumni Connect */}
      <section className="py-16 bg-gradient-to-b from-purple-100 to-blue-100 text-center">
        <h2 className="text-3xl font-bold mb-4">Alumni Connect</h2>
        <p className="text-gray-700 mb-6">Connect with our alumni community and view their details</p>

        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <input
            type="text"
            placeholder="Search Alumni Here..."
            className="w-80 px-4 py-2 border rounded-l-lg focus:outline-none"
          />
          <button className="bg-gray-300 px-4 py-2 rounded-r-lg">🔍</button>
        </div>

        {/* Alumni Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {alumni.map((a, i) => (
            <div key={i} className="bg-white shadow-lg rounded-lg p-6">
              <img src={a.img} alt={a.name} className="h-24 w-24 rounded-full mx-auto object-cover" />
              <h3 className="mt-4 font-semibold">{a.name}</h3>
              <p className="text-sm text-gray-600">{a.year} Batch</p>
              <p className="text-sm text-gray-600">{a.location}</p>
              <p className="text-sm text-gray-700">{a.role}</p>
              <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                {i === 0 ? "Connect" : "View Profile"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-700 mb-10">Here are some of the Infoverse frequently asked questions</p>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {faqs.map((faq, i) => (
            <div key={i} className="flex items-start space-x-4">
              <span className="text-blue-600 text-2xl">✦</span>
              <div>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="text-gray-600 text-sm mt-1">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Get In Touch */}
      <section className="py-16 bg-blue-500 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
        <p className="mb-12">We’d love to hear from you. Here’s how you can reach us:</p>

        <div className="flex flex-col md:flex-row justify-center gap-10 max-w-6xl mx-auto">
          {/* Talk to Sales */}
          <div className="bg-white text-black p-8 rounded-lg shadow-md flex-1">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="font-bold mb-2">Talk to Sales</h3>
            <p className="text-sm mb-4">Need quick assistance? Call us now and let Infoverse guide you.</p>
            <p className="text-green-600 font-semibold mb-2">+6178965433</p>
            <a href="#" className="text-blue-500 text-sm">View all global numbers</a>
          </div>

          {/* Contact Support */}
          <div className="bg-white text-black p-8 rounded-lg shadow-md flex-1">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold mb-2">Contact Support</h3>
            <p className="text-sm mb-4">Got an idea or query? Send us a message today.</p>
            <button className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">Contact Support</button>
          </div>
        </div>

        {/* Company Info */}
        <div className="mt-12 flex flex-col md:flex-row justify-between max-w-6xl mx-auto text-left text-black gap-6">
          <div className="flex-1">
            <img src="/Logo.png" alt="Infoverse Logo" className="h-12 mb-4" />
            <p>
              Infoverse is a comprehensive learning and career support platform designed to empower students.
              We provide structured placement training including aptitude practice, coding challenges, and career guidance.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex-1">
            <h4 className="font-bold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              {["Company", "Placed Students", "Contact Us"].map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-500 hover:text-gray-700">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Address */}
          <div className="flex-1">
            <h4 className="font-bold mb-2">Address</h4>
            <p className="text-sm">
              1st College, Yamn Road, Korangi, Andhra Pradesh, PIN 534411 <br />
              Email: infoverse@infgroup.com
            </p>
            <div className="mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.792230604352!2d83.297592!3d17.685411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a394ca2f9999999%3A0x7e5b4f3e3a3a3a3a!2sKorangi%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1599999999999"
                width="100%"
                height="150"
                className="border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

  

export default Landing;
