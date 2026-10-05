import LoginForm from "./login-form";

export const metadata = { title: "Sign in | Koetap" };

// Where Auth.js sends people when sign-in fails (see pages.error in lib/auth.js), as ?error=<code>.
const GOOGLE_MESSAGES = {
  OAuthAccountNotLinked: "An account with this email already exists. Sign in with your email and password instead.",
  // Pressing Cancel on Google's screen, or anything else that stops it finishing
  default: "Google sign-in didn't finish. If you cancelled, you can try again whenever you're ready.",
};

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  // A deactivated user who tries Google sign-in comes back here with ?error=AccessDenied.
  const message = !error || error === "AccessDenied" ? "" : (GOOGLE_MESSAGES[error] ?? GOOGLE_MESSAGES.default);
  return <LoginForm accessDenied={error === "AccessDenied"} initialError={message} />;
}
