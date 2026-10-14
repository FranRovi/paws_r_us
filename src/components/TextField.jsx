import { useId } from "react";

export default function TextField({
  label,
  error,
  className = "",
  ...inputProps
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-extrabold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-14 min-w-0 rounded-[14px] border-2 bg-field px-[18px] text-base focus:border-ink focus:outline-none ${
          error ? "border-red-700" : "border-field"
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
