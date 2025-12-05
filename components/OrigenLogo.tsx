
import React from 'react';

interface LogoProps {
  className?: string;
}

const OrigenLogo: React.FC<LogoProps> = ({ className = "h-10 w-10 text-black dark:text-white" }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* 
            Replica exacta del logo de Origen Iglesia (Triskelion orgánico).
            Formas (magatamas) reducidas y separadas fuertemente del centro.
        */}
        {[0, 120, 240].map((angle, i) => (
          <path
            key={i}
            transform={`rotate(${angle} 100 100) translate(90 15) scale(0.6)`}
            fill="currentColor"
            d="M 112 58 Q 140 18 182 58 A 45 45 0 0 1 134 134 Q 114 101 112 58 Z"
          />
        ))}
      </g>
    </svg>
  );
};

export default OrigenLogo;
