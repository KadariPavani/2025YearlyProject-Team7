
const HighlightTicker = () => {
  const highlights = [
    "⭐ Placements 2025 Are Live!",
    "⭐ Training Sessions Open for All Students",
    "⭐ New Courses Available Now",
    "⭐ Join Our Alumni Connect Today",
    "⭐ Placement Assistance Available",
  ];

  return (
    <div className="flex items-center px-2 py-1 bg-blue-45">
      <button className="bg-[#5791ED] text-white px-4 py-1.5 rounded-l-md text-sm font-medium">
        Highlights
      </button>
      <div className="overflow-hidden flex-1">
        <div className="inline-block animate-marquee ml-3">
          {highlights.map((text, i) => (
            <span key={i} className="mr-8 text-gray-800 text-sm font-medium">
              {text}
            </span>
          ))}
          {highlights.map((text, i) => (
            <span key={i + highlights.length} className="mr-8 text-gray-800 text-sm font-medium">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HighlightTicker;
