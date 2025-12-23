import React, { useMemo } from "react";

const InfoverseLoader = () => {
  const paths = useMemo(() => {
    const pointsA = [];
    const pointsB = [];
    const pointsC = [];

    const steps = 160;
    const center = 70;
    const radius = 52;
    const amplitude = 7;
    const frequency = 8;

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;

      const r1 = radius + amplitude * Math.sin(frequency * angle);
      const x1 = center + r1 * Math.cos(angle);
      const y1 = center + r1 * Math.sin(angle);
      pointsA.push(`${i === 0 ? "M" : "L"} ${x1},${y1}`);

      const r2 = radius + amplitude * Math.sin(frequency * angle + Math.PI);
      const x2 = center + r2 * Math.cos(angle);
      const y2 = center + r2 * Math.sin(angle);
      pointsB.push(`${i === 0 ? "M" : "L"} ${x2},${y2}`);

      const r3 = radius + amplitude * Math.sin(frequency * angle + Math.PI / 2);
      const x3 = center + r3 * Math.cos(angle);
      const y3 = center + r3 * Math.sin(angle);
      pointsC.push(`${i === 0 ? "M" : "L"} ${x3},${y3}`);
    }

    return {
      pathA: pointsA.join(" "),
      pathB: pointsB.join(" "),
      pathC: pointsC.join(" "),
    };
  }, []);

  return (
    <>
      <style>{`
        .infoverse-loader-container {
          height: 100vh;
          width: 100vw;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .infoverse-logo {
          width: 55px;
          height: 55px;
          z-index: 5;
          animation: pulse-logo 3s ease-in-out infinite;
        }

        .braid-loader-svg {
          position: absolute;
          width: 160px;
          height: 160px;
          animation: spin 12s linear infinite;
        }

        .braid-path {
          fill: none;
          stroke: #6f8fff;           /* lighter main blue */
          stroke-width: 1.8px;       /* Reduced from 2.5px - thinner border */
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 450;
          stroke-dashoffset: 450;
          animation: draw 3s ease-in-out infinite alternate;
        }

        .braid-path.secondary {
          stroke: #93a8ff;           /* lighter */
          animation-delay: 0.3s;
          opacity: 0.85;
        }

        .braid-path.tertiary {
          stroke: #bcc8ff;           /* lightest */
          animation-delay: 0.6s;
          opacity: 0.8;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes draw {
          0% { stroke-dashoffset: 450; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.9; }
        }
      `}</style>

      <div className="infoverse-loader-container">
        <div className="logo-wrapper">
          <svg className="braid-loader-svg" viewBox="0 0 140 140">
            <path d={paths.pathA} className="braid-path" />
            <path d={paths.pathB} className="braid-path secondary" />
            <path d={paths.pathC} className="braid-path tertiary" />
          </svg>

          <img
            src="/IFlogoIcon.png"
            alt="Infoverse Loading"
            className="infoverse-logo"
          />
        </div>
      </div>
    </>
  );
};

export default InfoverseLoader;
