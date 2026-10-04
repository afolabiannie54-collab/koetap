// A template is re-created on every navigation, so each dashboard page fades in. It sits inside the
// layout, so the sidebar and top bar stay put.
export default function DashboardTemplate({ children }) {
  return <div className="animate-fadeIn">{children}</div>;
}
