const SIZES = {
  sm: { icon: 40, paws: "text-3xl", rus: "text-base" },
  md: { icon: 64, paws: "text-5xl", rus: "text-2xl" },
  lg: { icon: 96, paws: "text-7xl", rus: "text-4xl" },
};

export default function PawLogo({ size = "md" }) {
  const s = SIZES[size];

  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label="Paws R Us"
      role="img"
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        className="fill-paw -rotate-[18deg]"
        aria-hidden="true"
      >
        <ellipse cx="6" cy="10" rx="2" ry="2.6" />
        <ellipse cx="10" cy="5.5" rx="2" ry="2.8" />
        <ellipse cx="14" cy="5.5" rx="2" ry="2.8" />
        <ellipse cx="18" cy="10" rx="2" ry="2.6" />
        <path d="M12 11c-3 0-6 3.2-6 5.8 0 1.7 1.3 2.7 3 2.7 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.7 0 3-1 3-2.7C18 14.2 15 11 12 11z" />
      </svg>
      <span
        className="flex flex-col font-logo leading-[0.85]"
        aria-hidden="true"
      >
        <span className={`${s.paws} text-brand`}>Paws</span>
        <span className={`${s.rus} text-brown self-end`}>R Us</span>
      </span>
    </span>
  );
}
