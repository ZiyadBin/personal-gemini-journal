import React from "react";

interface ReflectLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const ReflectLogo: React.FC<ReflectLogoProps> = ({
  size = 36,
  className = "",
  withGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-500/30 to-fuchsia-500/20 blur-md pointer-events-none"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ReflectAI Emblem"
      >
        <defs>
          {/* Circular clip mask */}
          <clipPath id="reflectLogoCircle">
            <circle cx="100" cy="100" r="98" />
          </clipPath>

          {/* Celestial Sunset/Dusk sky gradient */}
          <linearGradient id="twilightSkyGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="30%" stopColor="#4f46e5" />
            <stop offset="60%" stopColor="#9333ea" />
            <stop offset="85%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Deep royal/indigo hair gradient */}
          <linearGradient id="deepHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Radiant Azure & Cyan wave gradient */}
          <linearGradient id="cyanWaveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>

          {/* Twilight hills gradient */}
          <linearGradient id="duskHillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        <g clipPath="url(#reflectLogoCircle)">
          {/* Base Sky Sunset Gradient */}
          <rect width="200" height="200" fill="url(#twilightSkyGrad)" />

          {/* Dusk rolling hills at bottom right */}
          <path d="M 90 200 C 130 160 170 145 200 152 L 200 200 Z" fill="url(#duskHillGrad)" opacity="0.9" />
          <path d="M 120 200 C 150 175 180 170 200 175 L 200 200 Z" fill="#2563eb" opacity="0.85" />

          {/* Radiant 4-point Diamond Star */}
          <g transform="translate(142, 60)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" opacity="0.3" />
            <path d="M 0 -18 Q 0 0 -18 0 Q 0 0 0 18 Q 0 0 18 0 Q 0 0 0 -18 Z" fill="#fffdfa" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          </g>

          {/* Serene Face Profile & Neck (White Silhouette) */}
          <path
            d="M 88 38
               C 105 45 118 62 122 75
               C 123 78 120 83 124 87
               C 128 90 134 92 135 94
               C 134 96 131 97 131 99
               C 133 101 133 105 131 107
               C 129 108 132 112 131 115
               C 129 122 124 127 122 130
               C 117 137 110 147 104 160
               C 99 170 96 182 96 195
               C 95 198 94 200 92 200
               C 90 185 86 160 84 140
               C 80 115 82 85 85 55
               Z"
            fill="#ffffff"
          />

          {/* Delicate Closed Eye */}
          <path
            d="M 101 88 C 106 91 112 91 116 88"
            stroke="#1e1b4b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Flowing Layered Hair Waves & Petals */}
          {/* Top Crown sweep */}
          <path
            d="M 28 85
               C 38 48 70 30 92 40
               C 78 50 68 70 66 92
               C 52 75 38 78 28 85 Z"
            fill="#2563eb"
          />

          {/* Main Flowing Hair Lock */}
          <path
            d="M 28 85
               C 50 80 72 105 76 135
               C 85 110 84 75 92 40
               C 108 48 116 65 114 80
               C 105 85 96 100 95 118
               C 94 135 98 152 96 175
               C 92 165 85 155 75 145
               C 65 135 45 125 35 118
               Z"
            fill="url(#deepHairGrad)"
          />

          {/* Cyan / Light Blue Inner Waves */}
          <path
            d="M 75 108
               C 80 120 85 140 96 170
               C 92 155 88 135 84 125
               C 80 115 76 110 75 108 Z"
            fill="url(#cyanWaveGrad)"
          />
          <path
            d="M 75 108
               C 85 115 95 125 96 145
               C 94 158 90 170 96 182
               C 88 165 80 148 75 130 Z"
            fill="#38bdf8"
            opacity="0.85"
          />

          {/* Front White Petal / Leaf */}
          <path
            d="M 44 70
               C 55 90 58 118 73 135
               C 62 125 52 105 44 70 Z"
            fill="#ffffff"
          />

          {/* Bottom swooping base wave in navy blue */}
          <path
            d="M 28 132
               C 45 132 75 148 95 178
               C 80 168 55 155 28 155 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <path
            d="M 28 132
               C 50 135 78 155 95 198
               C 72 175 42 165 28 165 Z"
            fill="#1e3a8a"
          />
          <path
            d="M 26 132
               C 45 132 80 155 96 200
               C 65 195 40 180 26 160 Z"
            fill="#0f172a"
          />
        </g>

        {/* Outer Ring boundary */}
        <circle
          cx="100"
          cy="100"
          r="98"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

interface ReflectWordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  align?: "left" | "center";
  theme?: "dark" | "light";
  className?: string;
}

export const ReflectWordmark: React.FC<ReflectWordmarkProps> = ({
  size = "md",
  showTagline = false,
  align = "left",
  theme = "dark",
  className = "",
}) => {
  const fontSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-4xl sm:text-5xl",
  };

  const taglineSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base sm:text-lg",
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-left"} ${className}`}
    >
      <div className={`font-semibold tracking-tight leading-none font-heading ${fontSizes[size]} flex items-center`}>
        <span className={isDark ? "text-slate-100" : "text-slate-900"}>Reflect</span>
        <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent font-bold ml-[1px]">
          AI
        </span>
      </div>

      {showTagline && (
        <span
          className={`font-normal tracking-wide mt-1.5 ${taglineSizes[size]} font-sans ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Your thoughts. A new perspective.
        </span>
      )}
    </div>
  );
};
