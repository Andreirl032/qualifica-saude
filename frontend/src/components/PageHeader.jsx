export function PageHeader({ title, subtitle, align = 'center', className = '' }) {
  const alignment = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
  const classes = `space-y-2 ${alignment} ${className}`.trim()

  return (
    <div className={classes}>
      {title && <h1 className="text-2xl font-semibold">{title}</h1>}
      {subtitle && <p className="text-base-content/70 text-sm">{subtitle}</p>}
    </div>
  )
}
