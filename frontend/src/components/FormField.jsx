export function FormField({ label, error, children }) {
  return (
    <label className="form-control flex flex-col justify-start gap-1">
      <div className="label">
        <span className="label-text justify-start text-gray-700">{label}</span>
      </div>
      {children}
      {error && <span className="text-error text-sm">{error}</span>}
    </label>
  )
}
