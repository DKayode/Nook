import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Welcome</h1>
          <p className="mt-2 text-sm text-muted">Sign in or register a passkey on this device.</p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
