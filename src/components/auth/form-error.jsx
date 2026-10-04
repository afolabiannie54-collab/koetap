// A light red box with red text, for a message about the whole form (a wrong password, a failed request).
export function FormError({ children }) {
  return (
    <p role="alert" className="rounded-xl border border-error/30 bg-error-soft px-3.5 py-2.5 text-sm text-error-ink">
      {children}
    </p>
  );
}
