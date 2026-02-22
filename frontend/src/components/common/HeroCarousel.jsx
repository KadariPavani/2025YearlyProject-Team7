import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

// Static fallback slides (used when API returns no data)
const fallbackSlides = [
  {
    title: "Welcome to KIET",
    description: "Empowering future leaders through innovation and excellence.",
    imageUrl: "/image.png",
    buttonText: "Learn more",
  },
  {
    title: "Placements 2025 Are Live!",
    description: "Top companies are hiring talented graduates.",
    imageUrl: "/image1.png",
    buttonText: "Explore Jobs",
  },
  {
    title: "Training Sessions Open",
    description: "Upskill with our expert-led training programs.",
    imageUrl: "/image2.png",
    buttonText: "Join Now",
  },
];

const HeroCarousel = () => {
  const [slides, setSlides] = useState(fallbackSlides);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/public/landing-content`);
        if (res.data?.success && res.data.data?.heroSlides?.length > 0) {
          setSlides(res.data.data.heroSlides);
        }
      } catch (err) {
        console.warn('[HeroCarousel] Failed to fetch dynamic slides, using fallback:', err.message);
      }
    };
    fetchSlides();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[calc(100vh-90px)] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide._id || index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.imageUrl || slide.img}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
          />

          <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-[#6E9EDE]/100 via-[#6E9EDE]/95 to-transparent flex flex-col justify-center items-start px-6 sm:px-12 md:px-16 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-md">
              {slide.title}
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl max-w-md">
              {slide.description || slide.desc}
            </p>
            {(slide.buttonText || slide.btnText) && (
              slide.buttonUrl ? (
                <a href={slide.buttonUrl} target="_blank" rel="noopener noreferrer">
                  <button className="mt-5 sm:mt-6 bg-white text-[#6E9EDE] px-5 sm:px-7 py-2 sm:py-3 rounded hover:bg-gray-100 transition text-sm sm:text-base font-medium">
                    {slide.buttonText || slide.btnText}
                  </button>
                </a>
              ) : (
                <button className="mt-5 sm:mt-6 bg-white text-[#6E9EDE] px-5 sm:px-7 py-2 sm:py-3 rounded hover:bg-gray-100 transition text-sm sm:text-base font-medium">
                  {slide.buttonText || slide.btnText}
                </button>
              )
            )}
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-3 sm:left-5 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-80 text-lg sm:text-xl"
      >
        ❮
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-3 sm:right-5 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-80 text-lg sm:text-xl"
      >
        ❯
      </button>

      <div className="absolute bottom-4 sm:bottom-6 w-full flex justify-center space-x-2 sm:space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              currentSlide === index ? "bg-white" : "bg-gray-400"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
