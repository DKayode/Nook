export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-3 text-center">
        <h1 className="text-3xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-muted">
          We sent a sign-in link to your email. Click it to continue.
        </p>
        <p className="text-xs text-muted">
          Local dev: open Mailpit at <a className="underline" href="http://localhost:8025">localhost:8025</a> to grab the link.
        </p>
      </div>
    </main>
  );
}
