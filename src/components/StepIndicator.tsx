interface StepIndicatorProps {
  steps: string[]
  current: number
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-center gap-0 w-full">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current

        return (
          <div key={i} className="flex items-start">
            {/* Step column: circle + label */}
            <div className="flex flex-col items-center gap-2 min-w-[64px]">
              <div className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center
                text-xs font-semibold transition-all duration-300 shrink-0
                ${done
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : active
                  ? 'bg-white border-violet-600 text-violet-600 shadow-[0_0_0_3px_rgba(124,58,237,0.1)]'
                  : 'bg-white border-slate-200 text-slate-400'
                }
              `}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>

              <span className={`text-xs font-medium text-center transition-colors ${
                active ? 'text-violet-600' : done ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>

            {/* Connector line between steps */}
            {i < steps.length - 1 && (
              <div className="relative h-[2px] w-10 sm:w-14 mt-[13px] shrink-0 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-in-out"
                  style={{
                    width: done ? '100%' : '0%',
                    background: 'linear-gradient(to right, #7c3aed, #a78bfa)',
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
