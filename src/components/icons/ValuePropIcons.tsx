// Restrained single-stroke line icons matching the app's premium/editorial tone -
// no emoji, no filled illustrations. currentColor so each card can tint its own icon.

type IconProps = { className?: string };

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TasteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M6 13 Q6 24 16 24 Q26 24 26 13" {...strokeProps} />
      <ellipse cx="16" cy="13" rx="10" ry="3" {...strokeProps} />
      <line x1="14" y1="27" x2="18" y2="27" {...strokeProps} />
      <g transform="rotate(28 23 8)">
        <ellipse cx="23" cy="6" rx="2.6" ry="3.6" {...strokeProps} />
        <line x1="23" y1="9.4" x2="23" y2="17" {...strokeProps} />
      </g>
    </svg>
  );
}

export function PresentationIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="12" y="7" width="8" height="4" rx="1.3" {...strokeProps} />
      <rect x="5" y="10.5" width="22" height="15.5" rx="3" {...strokeProps} />
      <circle cx="16" cy="18.5" r="5.2" {...strokeProps} />
      <circle cx="16" cy="18.5" r="1.9" {...strokeProps} />
      <circle cx="22.2" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PriceTagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 5 L27 16 L16 27 L5 16 Z" {...strokeProps} />
      <circle cx="11.5" cy="11.5" r="1.7" {...strokeProps} />
    </svg>
  );
}
