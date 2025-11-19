export function FormField({ label, error, children }) {
  return (
    <label className="form-control">
      <div className="label">
        <span className="label-text">{label}</span>
      </div>
      {children}
      {error && <span className="text-error text-sm">{error}</span>}
    </label>
  )
}
