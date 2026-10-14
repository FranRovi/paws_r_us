import { useId } from 'react'

export default function SelectField({ label, options, className = '', ...selectProps }) {
  const id = useId()

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-extrabold">
        {label}
      </label>
      <select
        id={id}
        className="h-14 min-w-0 rounded-[14px] border-2 border-field bg-field px-3.5 text-base focus:border-ink focus:outline-none"
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}