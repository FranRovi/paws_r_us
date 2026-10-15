export default function PageCard({ children, className = "" }) {
  return (
    <div className={`rounded-[40px] bg-white px-10 pb-10 pt-9 ${className}`}>
      {children}
    </div>
  );
}
