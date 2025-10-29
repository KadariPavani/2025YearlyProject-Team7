import React, { useState, useEffect } from 'react';

export default function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(2);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Williams",
      role: "UI Designer",
      rollNumber: "18CS1001",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Minus veniam repudiatur dolectus, est allis recusantibus.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
    },
    {
      id: 2,
      name: "Jessica Jones",
      role: "Frontend Engineer",
      rollNumber: "18CS1002",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Minus veniam repudiatur dolectus, est allis recusantibus.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop"
    },
    {
      id: 3,
      name: "Mark Smith",
      role: "Backend Engineer",
      rollNumber: "18CS1003",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Minus veniam repudiatur dolectus, est allis recusantibus.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop"
    },
    {
      id: 4,
      name: "Emily Davis",
      role: "Data Scientist",
      rollNumber: "18CS1004",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Minus veniam repudiatur dolectus, est allis recusantibus.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop"
    },
    {
      id: 5,
      name: "John Carter",
      role: "DevOps Engineer",
      rollNumber: "18CS1005",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Minus veniam repudiatur dolectus, est allis recusantibus.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getCardStyle = (index) => {
    const diff = index - currentIndex;
    let position;
    
    if (diff === 0) position = 0;
    else if (diff === 1 || diff === -(testimonials.length - 1)) position = 1;
    else if (diff === -1 || diff === testimonials.length - 1) position = -1;
    else if (diff === 2 || diff === -(testimonials.length - 2)) position = 2;
    else if (diff === -2 || diff === testimonials.length - 2) position = -2;
    else position = 3;
    
    if (position === 0) {
      return {
        transform: 'translateX(-230px) translateY(-30%) scale(1)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'none'
      };
    } else if (position === 1) {
      return {
        transform: 'translateX(26%) translateY(-30%) scale(0.75)',
        opacity: 0.5,
        zIndex: 20,
        pointerEvents: 'auto'
      };
    } else if (position === -1) {
      return {
        transform: 'translateX(-130%) translateY(-30%) scale(0.75)',
        opacity: 0.5,
        zIndex: 20,
        pointerEvents: 'auto'
      };
    } else if (position === 2) {
      return {
        transform: 'translateX(60%) translateY(-30%) scale(0.6)',
        opacity: 0.3,
        zIndex: 10,
        pointerEvents: 'auto'
      };
    } else if (position === -2) {
      return {
        transform: 'translateX(-160%) translateY(-30%) scale(0.6)',
        opacity: 0.3,
        zIndex: 10,
        pointerEvents: 'auto'
      };
    } else {
      return {
        transform: 'translateX(0) translateY(-30%) scale(0.5)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none'
      };
    }
  };

  const handleCardClick = (index) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  return (
    // 👇 Added the ID "students" here
    <section id="students" className="w-full flex flex-col items-center justify-center py-8" style={{ background: '#5791ED' }}>
      
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-4">Placement Success Stories</h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Hear what our successful candidates have to say about their journey with us
        </p>
      </div>

      <div className="relative w-full max-w-7xl h-80">
        {testimonials.map((testimonial, index) => {
          const style = getCardStyle(index);
          
          return (
            <div 
              key={testimonial.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md transition-all duration-500 ease-in-out cursor-pointer"
              style={style}
              onClick={() => handleCardClick(index)}
            >
              <div className={`rounded-2xl shadow-2xl p-8 text-center transition-all duration-500 ${
                index === currentIndex ? 'bg-white' : 'bg-blue-200'
              }`}>
                <div className="flex justify-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-40 h-40 rounded-full border-4 border-teal-500 object-cover"
                    style={{ objectPosition: 'center' }}
                  />
                </div>

                <h3 className={`font-semibold text-2xl mb-1 ${
                  index === currentIndex ? 'text-gray-900' : 'text-blue-900'
                }`}>
                  {testimonial.name}
                </h3>

                <div className="text-sm mb-3" style={{ color: index === currentIndex ? '#374151' : '#1e3a8a' }}>
                  {testimonial.role} &nbsp;•&nbsp; Roll No: {testimonial.rollNumber}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center text-white/80 text-sm">
        <p>Click on side cards or use arrow keys to navigate</p>
      </div>
    </section>
  );
}
