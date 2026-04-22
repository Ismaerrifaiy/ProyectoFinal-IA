interface IsmAuthLogoProps {
  className?: string
}

export function IsmAuthMark({ className = '' }: IsmAuthLogoProps) {
  return <IsmAuthLogoFull className={className} />
}

export function IsmAuthLogoFull({ className = '' }: IsmAuthLogoProps) {
  return (
    <span className={`select-none tracking-tight ${className}`} style={{ letterSpacing: '-0.03em' }}>
      <span className="font-bold text-slate-900">Ism</span><span className="font-light text-slate-900">Auth</span>
    </span>
  )
}
