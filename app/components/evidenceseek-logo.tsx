/**
 * SeekEvidence Logo Component
 * Professional pharmaceutical AI branding
 */

import React from "react";
import styles from "./evidenceseek-logo.module.scss";

export interface LogoProps {
  variant?: "full" | "icon" | "horizontal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SeekEvidenceLogo({
  variant = "horizontal",
  size = "md",
  className = "",
}: LogoProps) {
  const sizeMap = {
    sm: { width: 120, height: 36, iconSize: 24 },
    md: { width: 180, height: 54, iconSize: 36 },
    lg: { width: 240, height: 72, iconSize: 48 },
  };

  const dimensions = sizeMap[size];

  if (variant === "icon") {
    return (
      <div
        className={`${styles.logoContainer} ${styles.iconOnly} ${className}`}
      >
        <svg
          width={dimensions.iconSize}
          height={dimensions.iconSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(4, 2)">
            <path
              d="M2 2 Q 5 8, 2 14 Q -1 20, 2 26"
              stroke="url(#gradient1)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M14 2 Q 11 8, 14 14 Q 17 20, 14 26"
              stroke="url(#gradient2)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <line
              x1="3"
              y1="5"
              x2="13"
              y2="5"
              stroke="#00BCD4"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <line
              x1="2"
              y1="14"
              x2="14"
              y2="14"
              stroke="#00BCD4"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <line
              x1="3"
              y1="23"
              x2="13"
              y2="23"
              stroke="#00BCD4"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <circle cx="2" cy="2" r="1.5" fill="#006B7D" />
            <circle cx="14" cy="2" r="1.5" fill="#00BCD4" />
            <circle cx="2" cy="26" r="1.5" fill="#006B7D" />
            <circle cx="14" cy="26" r="1.5" fill="#00BCD4" />
          </g>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#006B7D", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#00BCD4", stopOpacity: 1 }}
              />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#00BCD4", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#006B7D", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className={`${styles.logoContainer} ${styles[variant]} ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* DNA Helix Icon */}
        <g id="dna-helix">
          <path
            d="M8 10 Q 12 20, 8 30 Q 4 40, 8 50"
            stroke="url(#gradient1)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M20 10 Q 16 20, 20 30 Q 24 40, 20 50"
            stroke="url(#gradient2)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="15"
            x2="20"
            y2="15"
            stroke="#00BCD4"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line
            x1="10"
            y1="22"
            x2="18"
            y2="22"
            stroke="#006B7D"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line
            x1="8"
            y1="30"
            x2="20"
            y2="30"
            stroke="#00BCD4"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line
            x1="10"
            y1="38"
            x2="18"
            y2="38"
            stroke="#006B7D"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line
            x1="8"
            y1="45"
            x2="20"
            y2="45"
            stroke="#00BCD4"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle cx="8" cy="10" r="2" fill="#006B7D" />
          <circle cx="20" cy="10" r="2" fill="#00BCD4" />
          <circle cx="8" cy="50" r="2" fill="#006B7D" />
          <circle cx="20" cy="50" r="2" fill="#00BCD4" />
        </g>

        {/* Wordmark */}
        <text
          x="35"
          y="35"
          fontFamily="'Inter', 'SF Pro Display', sans-serif"
          fontSize="22"
          fontWeight="600"
          fill="var(--text-primary, #1A237E)"
        >
          Evidence<tspan fill="#006B7D">Seek</tspan>
        </text>

        {variant === "full" && (
          <text
            x="35"
            y="50"
            fontFamily="'Inter', sans-serif"
            fontSize="9"
            fontWeight="400"
            fill="var(--text-secondary, #455A64)"
            letterSpacing="0.5"
          >
            AI-POWERED MICROBIOLOGY ANALYSIS
          </text>
        )}

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#006B7D", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#00BCD4", stopOpacity: 1 }}
            />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#00BCD4", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#006B7D", stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default SeekEvidenceLogo;
