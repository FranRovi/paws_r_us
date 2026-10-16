const DOT = {
  done: "border-brand bg-brand text-ink",
  now: "border-brand bg-white text-text",
  todo: "border-white bg-white text-muted",
};

const STATE_TEXT = {
  done: "completed",
  now: "current step",
  todo: "not started",
};

export default function ApplicationStepper({ steps }) {
  return (
    <ol className="grid grid-cols-4">
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={step.state === "now" ? "step" : undefined}
          className="flex flex-col gap-2.5 pr-3"
        >
          <div className="flex items-center">
            <div
              aria-hidden="true"
              className={`flex size-9 shrink-0 items-center justify-center rounded-full border-[3px] text-[15px] font-extrabold ${DOT[step.state]}`}
            >
              {step.state === "done" ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={`ml-1.5 h-[3px] flex-1 ${step.state === "done" ? "bg-brand" : "bg-white"}`}
              />
            )}
          </div>
          <span className="text-[15px] font-extrabold">
            {step.label}
            <span className="sr-only"> ({STATE_TEXT[step.state]})</span>
          </span>
          <span className="text-[13px] leading-normal text-muted">
            {step.detail}
          </span>
        </li>
      ))}
    </ol>
  );
}
