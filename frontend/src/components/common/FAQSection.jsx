import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronDown, HelpCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const fallbackFaqs = [
  {
    question: "How To Register As A Student",
    answer: "Students can register by signing up with their details. After verification, they will get access to their personalized dashboard.",
  },
  {
    question: "How To Apply For Placements",
    answer: "Eligible students will see the event in the Company Updates section of their dashboard and can apply directly from there.",
  },
  {
    question: "How To Update My Profile",
    answer: "Login → Profile Settings → Add details like CGPA, Projects, Certifications, Resume, LinkedIn, GitHub, etc.",
  },
  {
    question: "How To Access Training Materials",
    answer: "Trainers upload study materials, assignments, and quizzes to the platform. Students can access them under the 'Resources' section.",
  },
  {
    question: "How To Mark Attendance",
    answer: "Student coordinators can mark presence via Attendance Dashboard. This reflects in student reports.",
  },
  {
    question: "How To Connect With Alumni",
    answer: "Use the Alumni Connect feature to search alumni based on skills, companies, or location.",
  },
];

const FAQSection = () => {
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/public/landing-content`);
        if (res.data?.success && res.data.data?.faqs?.length > 0) {
          const dynamicFaqs = res.data.data.faqs.map(f => ({
            question: f.question,
            answer: f.answer,
          }));
          setFaqs(dynamicFaqs);
        }
      } catch (err) {
        console.warn('[FAQSection] Failed to fetch dynamic FAQs, using fallback:', err.message);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <section id="faqs" className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Two-column layout: left info + right accordion */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-16 items-start">

          {/* Left side - sticky heading */}
          <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-28">
            <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2 sm:mb-3">
              Frequently Asked<br className="hidden sm:block" /> Questions
            </h2>
            <p className="text-[10px] sm:text-sm md:text-base text-gray-500 leading-relaxed">
              Everything you need to know about Infoverse. Can't find what you're looking for? Reach out to us.
            </p>
            <a
              href="/contact"
              className="hidden lg:inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-[#5791ED] hover:text-indigo-700 transition-colors"
            >
              Contact us
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* Right side - accordion */}
          <div className="flex-1 w-full">
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={faq._id || i} className="group">
                    <button
                      onClick={() => toggleFAQ(i)}
                      className="w-full flex items-start gap-2 sm:gap-4 py-3 sm:py-5 text-left focus:outline-none"
                    >
                      {/* Number */}
                      <span className="shrink-0 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gray-100 group-hover:bg-[#5791ED]/10 flex items-center justify-center text-[9px] sm:text-xs font-bold text-gray-400 group-hover:text-[#5791ED] transition-colors mt-px sm:mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      {/* Question */}
                      <span className={`flex-1 text-xs sm:text-base md:text-lg font-medium transition-colors ${isOpen ? 'text-[#5791ED]' : 'text-gray-800 group-hover:text-gray-900'}`}>
                        {faq.question || faq.q}
                      </span>

                      {/* Chevron */}
                      <ChevronDown
                        className={`shrink-0 w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 mt-px sm:mt-0.5 ${isOpen ? 'rotate-180 text-[#5791ED]' : ''}`}
                      />
                    </button>

                    {/* Answer */}
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}
                    >
                      <p className="pb-3 sm:pb-5 pl-7 sm:pl-11 pr-4 sm:pr-8 text-[10px] sm:text-sm md:text-base text-gray-500 leading-relaxed">
                        {faq.answer || faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
