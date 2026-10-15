export default function PawIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <ellipse cx="6" cy="10" rx="2" ry="2.6" />
      <ellipse cx="10" cy="5.5" rx="2" ry="2.8" />
      <ellipse cx="14" cy="5.5" rx="2" ry="2.8" />
      <ellipse cx="18" cy="10" rx="2" ry="2.6" />
      <path d="M12 11c-3 0-6 3.2-6 5.8 0 1.7 1.3 2.7 3 2.7 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.7 0 3-1 3-2.7C18 14.2 15 11 12 11z" />
    </svg>
  );
}
