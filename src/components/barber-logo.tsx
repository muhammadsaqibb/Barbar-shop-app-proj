import React from 'react';

const BarberLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="100" cy="100" r="95" className="text-blue-200" fill="currentColor" />

    {/* Shirt */}
    <path d="M65 198 a 200 200 0 0 1 70 0 v -50 a 10 10 0 0 0 -20 -5 h -30 a 10 10 0 0 0 -20 5 Z" className="text-red-600" fill="currentColor" />
    <path d="M85 143 h 30 v 10 h-30 Z" className="text-red-500" fill="currentColor"/>

    {/* Head */}
    <path d="M80 145 C 65 145 60 110 80 95 H 120 C 140 110 135 145 120 145 Z" className="text-amber-200" fill="currentColor" />

    {/* Hair & Beard */}
    <g className="text-black" fill="currentColor">
      {/* Beard */}
      <path d="M82 115 C 75 125 80 145 100 145 C 120 145 125 125 118 115 A 30 30 0 0 0 82 115 Z" />
      {/* Hair */}
      <path d="M80 95 C 60 90 70 65 100 65 C 130 65 140 90 120 95 A 50 50 0 0 1 80 95 Z" />
      {/* Mustache */}
      <path d="M90 118 C 95 114 105 114 110 118 C 105 122 95 122 90 118 Z" />
    </g>

    {/* Arms and Tools */}
    <g className="text-neutral-300" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* Left Arm and Razor */}
      <path d="M 75 145 L 50 160 L 90 180 L 100 160" fill="#fde68a" stroke="none" />
      <g transform="translate(45 150) rotate(-20)">
        <path d="M 0 0 H 12 V -25 H 0 Z" fill="#9ca3af"/>
        <path d="M 0 -25 H 12 V -30 H -5 Z" fill="#e5e7eb" />
      </g>
      
      {/* Right Arm and Scissors */}
      <path d="M 125 145 L 150 160 L 110 180 L 100 160" fill="#fde68a" stroke="none" />
      <g transform="translate(145 150) rotate(20)">
        <circle cx="-10" cy="0" r="5" strokeWidth="2.5" fill="none" />
        <circle cx="-10" cy="15" r="5" strokeWidth="2.5" fill="none" />
        <line x1="-5" y1="2" x2="15" y2="20" strokeWidth="2.5" />
        <line x1="-5" y1="13" x2="15" y2="-5" strokeWidth="2.5" />
      </g>
    </g>
  </svg>
);

export default BarberLogo;
