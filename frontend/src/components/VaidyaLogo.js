import React from 'react';

/**
 * VaidyaLogo — SVG icon for the Vaidya AI health chatbot
 *
 * Props:
 *   size    {number}  — diameter in px (default 44)
 *   variant {string}  — "color" | "white" | "dark"  (default "color")
 *   animated {bool}   — pulse animation on the EKG line (default true)
 */
const VaidyaLogo = ({ size = 44, variant = 'color', animated = true }) => {
  const isWhite  = variant === 'white';
  const isDark   = variant === 'dark';

  // Palette
  const bg       = isWhite ? 'transparent' : isDark ? '#1e293b' : '#2563eb';
  const shield   = isWhite ? 'rgba(255,255,255,0.18)' : isDark ? '#334155' : '#1d4ed8';
  const cross1   = isWhite ? 'rgba(255,255,255,0.9)' : '#ffffff';
  const ekg      = isWhite ? 'rgba(255,255,255,0.95)' : '#93c5fd';
  const dot      = isWhite ? 'rgba(255,255,255,0.7)'  : '#60a5fa';

  const half = size / 2;
  const r = half;
  // Scale factor — design was built at size=44
  const s = size / 44;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vaidya AI health assistant"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* ── Animated styles ── */}
      {animated && (
        <style>{`
          @keyframes vaidya-ekg {
            0%,100% { stroke-dashoffset: 0; }
            50%      { stroke-dashoffset: -48; }
          }
          @keyframes vaidya-dot {
            0%,100% { opacity:1; r:${2.2*s}; }
            50%      { opacity:0.4; r:${1.4*s}; }
          }
          .vekg { animation: vaidya-ekg 2.4s ease-in-out infinite; }
          .vdot { animation: vaidya-dot 2.4s ease-in-out infinite; }
        `}</style>
      )}

      {/* ── Outer circle background ── */}
      <circle cx={half} cy={half} r={r} fill={bg} />

      {/* ── Shield / chat-bubble shape ── */}
      <path
        d={`
          M ${half} ${8*s}
          C ${half} ${8*s} ${37*s} ${14*s} ${37*s} ${22*s}
          C ${37*s} ${32*s} ${30*s} ${38*s} ${half} ${40*s}
          C ${14*s} ${38*s} ${7*s} ${32*s} ${7*s} ${22*s}
          C ${7*s} ${14*s} ${half} ${8*s} ${half} ${8*s} Z
        `}
        fill={shield}
      />

      {/* ── Medical cross (vertical bar) ── */}
      <rect
        x={half - 2.2*s}
        y={15*s}
        width={4.4*s}
        height={13*s}
        rx={2.2*s}
        fill={cross1}
        opacity="0.95"
      />
      {/* ── Medical cross (horizontal bar) ── */}
      <rect
        x={half - 6.5*s}
        y={21.5*s}
        width={13*s}
        height={4.4*s}
        rx={2.2*s}
        fill={cross1}
        opacity="0.95"
      />

      {/* ── EKG pulse line (subtle, behind cross) ── */}
      <polyline
        className={animated ? 'vekg' : ''}
        points={`
          ${4*s},${33*s}
          ${10*s},${33*s}
          ${13*s},${28*s}
          ${16*s},${38*s}
          ${19*s},${25*s}
          ${22*s},${33*s}
          ${28*s},${33*s}
          ${31*s},${29*s}
          ${34*s},${33*s}
          ${40*s},${33*s}
        `}
        stroke={ekg}
        strokeWidth={1.6*s}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="48"
        strokeDashoffset="0"
        opacity="0.8"
      />

      {/* ── Live pulse dot ── */}
      <circle
        className={animated ? 'vdot' : ''}
        cx={22*s}
        cy={33*s}
        r={2.2*s}
        fill={dot}
      />
    </svg>
  );
};

export default VaidyaLogo;