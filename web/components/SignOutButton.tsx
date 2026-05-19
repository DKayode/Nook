import { signOut } from "@/lib/auth";

export function SignOutButton({ variant = "default" }: { variant?: "default" | "subtle" }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/sign-in" });
      }}
    >
      <button
        type="submit"
        className={
          variant === "subtle"
            ? "text-sm text-muted hover:text-red-300"
            : "w-full rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20"
        }
      >
        Sign out
      </button>
    </form>
  );
}
