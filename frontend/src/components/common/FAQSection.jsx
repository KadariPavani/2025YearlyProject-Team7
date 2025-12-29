import React, { useState } from "react";

const faqs = [
  {
    q: "How To Register As A Student",
    a: "Students can register by signing up with their details. After verification, they will get access to their personalized dashboard.",
  },
  {
    q: "How To Apply For Placements",
    a: "Eligible students will see the event in the Company Updates section of their dashboard and can apply directly from there.",
  },
  {
    q: "How To Update My Profile",
    a: "Login → Profile Settings → Add details like CGPA, Projects, Certifications, Resume, LinkedIn, GitHub, etc.",
  },
  {
    q: "How To Access Training Materials",
    a: "Trainers upload study materials, assignments, and quizzes to the platform. Students can access them under the ‘Resources’ section.",
  },
  {
    q: "How To Mark Attendance",
    a: "Student coordinators can mark presence via Attendance Dashboard. This reflects in student reports.",
  },
  {
    q: "How To Connect With Alumni",
    a: "Use the Alumni Connect feature to search alumni based on skills, companies, or location.",
  },
];

const FAQSection = () => {
  // Each FAQ card will have its own open state array
  const [openStates, setOpenStates] = useState(Array(faqs.length).fill(false));

  const toggleFAQ = (index) => {
    setOpenStates((prev) =>
      prev.map((open, i) => (i === index ? !open : open))
    );
  };

  return (
    <section id="faqs" className="w-full py-12 md:py-16 lg:py-20 bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-sm md:text-base text-gray-600 mb-12 max-w-2xl mx-auto">
          Here are some of the most common questions about Infoverse, answered clearly.
        </p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {faqs.map((faq, i) => (
    <div
      key={i}
      className="bg-blue-50 shadow-md rounded-xl p-4 md:p-6 hover:shadow-xl transition-shadow duration-300 w-full"
    >
      <button
        onClick={() => toggleFAQ(i)}
        className="flex items-center justify-between w-full text-left focus:outline-none"
      >
        <h3 className="font-semibold text-lg text-gray-800">{faq.q}</h3>
        <span
          className={`ml-2 text-black text-2xl transform transition-transform duration-300 ${
            openStates[i] ? "rotate-45" : "rotate-0"
          }`}
        >
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out`}
        style={{
          maxHeight: openStates[i] ? "300px" : "0px",
        }}
      >
        <p
          className={`mt-4 text-gray-600 text-sm transition-opacity duration-300 ${
            openStates[i] ? "opacity-100" : "opacity-0"
          }`}
        >
          {faq.a}
        </p>
      </div>
    </div>
  ))}
</div>

      </div>
    </section>
  );
};

export default FAQSection;
