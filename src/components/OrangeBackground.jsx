export default function OrangeBackground({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-brand text-text ${className}`}>
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-60 h-[560px] w-[560px] rounded-full bg-white/15"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-72 -left-52 h-[640px] w-[640px] rounded-full bg-white/15"
      />
      <div className="relative">{children}</div>
    </div>
  )
}