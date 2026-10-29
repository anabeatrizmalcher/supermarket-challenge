// Simple SVG seller. Apron/hat colors change per shop.
export default function Seller({ color = '#f59e0b', hat = true }: { color?: string; hat?: boolean }) {
  return (
    <svg viewBox="0 0 120 190" className="h-44 drop-shadow-md" role="img" aria-label="Shop seller">
      {hat && <rect x="34" y="6" width="52" height="24" rx="8" fill="#fff" />}
      <circle cx="60" cy="50" r="28" fill="#fcd9b6" />
      <circle cx="50" cy="48" r="3.5" fill="#333" />
      <circle cx="70" cy="48" r="3.5" fill="#333" />
      <path d="M48 60 Q60 72 72 60" stroke="#c0392b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <rect x="28" y="80" width="64" height="80" rx="16" fill="#fff" />
      <rect x="36" y="92" width="48" height="68" rx="10" fill={color} />
      <rect x="38" y="158" width="16" height="28" rx="6" fill="#4b5563" />
      <rect x="66" y="158" width="16" height="28" rx="6" fill="#4b5563" />
      <rect x="10" y="86" width="20" height="14" rx="7" fill="#fcd9b6" transform="rotate(25 20 93)" />
      <rect x="90" y="86" width="20" height="14" rx="7" fill="#fcd9b6" transform="rotate(-25 100 93)" />
    </svg>
  );
}
