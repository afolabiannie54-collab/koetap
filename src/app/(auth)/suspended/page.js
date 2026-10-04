import { SuspendedSignOut } from "./suspended-sign-out";

export const metadata = { title: "Account suspended | Koetap" };

// Deliberately bare: no navigation. The proxy sends every page here while a business is suspended.
export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Account suspended</h1>
        <p className="mt-3 text-sm text-gray-600">
          Your account has been suspended. Please contact{" "}
          <a href="mailto:support@koetap.com" className="font-medium text-indigo-600 hover:underline">
            support@koetap.com
          </a>{" "}
          for assistance.
        </p>
        <SuspendedSignOut />
      </div>
    </main>
  );
}
