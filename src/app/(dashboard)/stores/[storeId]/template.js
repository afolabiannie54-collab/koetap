// Fades only the tab content when you switch tabs; the store header and tabs stay put.
export default function StoreTabTemplate({ children }) {
  return <div className="animate-fadeIn">{children}</div>;
}
