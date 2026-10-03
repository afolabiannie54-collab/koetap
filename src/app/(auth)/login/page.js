import LoginForm from "./login-form";

export const metadata = { title: "Sign in | Koetap" };

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;
  // A deactivated user who tries Google sign-in comes back here with ?error=AccessDenied.
  return <LoginForm accessDenied={error === "AccessDenied"} />;
}
