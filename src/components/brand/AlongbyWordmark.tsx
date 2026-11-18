import React from 'react';

interface AlongbyWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional custom text color override if not using currentColor */
  color?: string;
}

const sizeClasses = {
  sm: 'text-[20px] sm:text-[22px]',
  // Navigation header size (30px mobile, 33px desktop)
  // Optical vertical centering: shifted 1px upward from previous position (-3px mobile, -3.5px desktop)
  // to compensate for Lobster's deep descenders on 'g' and 'y' and align visual letterforms with nav items
  md: 'text-[30px] sm:text-[33px] transform -translate-y-[3px] sm:-translate-y-[3.5px]',
  lg: 'text-[34px] sm:text-[36px]',
  xl: 'text-[42px] sm:text-[46px]',
};

/**
 * Alongby Brand Wordmark
 *
 * Typeset in the authentic Lobster typeface by Impallari Type.
 *
 * Characteristics:
 * - Exact "alongby" in lowercase
 * - Authentic Lobster typeface (weight 400 regular) imported from Google Fonts
 * - Natural connected cursive typography with preserved tracking (no artificial letter spacing)
 * - Theme-aware monochrome branding: dark in light mode, light in dark mode
 * - Slightly increased visual presence for distinct clarity in navigation
 * - Clear vertical alignment and generous clearance ensuring no clipping of 'g' and 'y' descenders
 * - Responsive sizing across mobile and desktop viewports
 */
export const AlongbyWordmark: React.FC<AlongbyWordmarkProps> = ({
  className = '',
  size = 'md',
  color,
}) => {
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center select-none font-normal tracking-normal leading-none overflow-visible text-[var(--color-text-primary)] antialiased ${sizeClass} ${className}`}
      style={{
        fontFamily: "var(--font-logo, 'Lobster', cursive)",
        color: color || undefined,
      }}
      title="alongby"
      aria-label="alongby"
    >
      alongby
    </span>
  );
};
