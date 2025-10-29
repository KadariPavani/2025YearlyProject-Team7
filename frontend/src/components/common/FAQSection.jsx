import React, { useState } from "react";

const faqs = [
  { q: "How To Register As A Student", a: "Students can register by signing up with their details. After verification, they will get access to their personalized dashboard." },
  { q: "How To Apply For Placements", a: "Eligible students will see the event in the Company Updates section of their dashboard and can apply directly from there." },
  { q: "How To Update My Profile", a: "Login → Profile Settings → Add details like CGPA, Projects, Certifications, Resume, LinkedIn, GitHub, etc." },
  { q: "How To Access Training Materials", a: "Trainers upload study materials, assignments, and quizzes to the platform. Students can access them under the ‘Resources’ section." },
  { q: "How To Mark Attendance", a: "Student coordinators can mark presence via Attendance Dashboard. This reflects in student reports." },
  { q: "How To Connect With Alumni", a: "Use the Alumni Connect feature to search alumni based on skills, companies, or location." },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section id="faqs" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Here are some of the most common questions about Infoverse, answered clearly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-blue-50 shadow-md rounded-xl p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <button
                onClick={() => toggleFAQ(i)}
                className="flex items-center justify-between w-full text-left focus:outline-none"
              >
                <h3 className="font-semibold text-lg text-gray-800">{faq.q}</h3>
                <span
                  className="ml-2 text-black text-2xl transform transition-transform duration-300"
                  style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}
                >
                  +
                </span>
              </button>
              <div
                className={`mt-4 text-gray-600 text-sm transition-all duration-500 ease-in-out overflow-hidden ${
                  openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
