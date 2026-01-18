import React from 'react';

const BarberLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="100" cy="100" r="95" className="text-secondary" fill="currentColor" />

    {/* Tools in Background */}
    <g transform="translate(100, 110)" className="text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        {/* Scissors */}
        <g transform="rotate(-30) translate(-50, 0)">
            <circle cx="0" cy="40" r="15"/>
            <line x1="0" y1="25" x2="0" y2="-40"/>
            <line x1="10" y1="-20" x2="-10" y2="-40"/>
        </g>
        {/* Razor */}
        <g transform="rotate(30) translate(50, 0)">
            <line x1="0" y1="30" x2="0" y2="-20" />
            <rect x="-10" y="-40" width="20" height="20" fill="currentColor" stroke="none" />
        </g>
    </g>

    {/* Body */}
    <path d="M80 125 h40 v50 h-40Z" className="text-primary" fill="currentColor"/>
    
    {/* Head */}
    <circle cx="100" cy="100" r="35" className="text-amber-300" fill="currentColor" />

    {/* Hair & Beard */}
    <g className="text-foreground" fill="currentColor">
      {/* Hair */}
      <path d="M100 65 A 35 35 0 0 0 100 135 A 25 25 0 0 1 100 65 Z" />
      {/* Beard */}
      <path d="M100 135 A 35 35 0 0 0 85 105 C 80 125 90 140 100 140 C 110 140 120 125 115 105 A 35 35 0 0 0 100 135 Z" />
       {/* Mustache */}
      <path d="M90 122 C 95 118 105 118 110 122 C 105 126 95 126 90 122 Z" />
    </g>

  </svg>
);

export default BarberLogo;
