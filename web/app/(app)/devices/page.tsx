import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddPasskeyButton } from "@/components/AddPasskeyButton";
import { DeleteDeviceButton } from "@/components/DeleteDeviceButton";

export default async function DevicesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const authenticators = await prisma.authenticator.findMany({
    where: { userId },
    select: {
      credentialID: true,
      credentialDeviceType: true,
      credentialBackedUp: true,
      transports: true,
    },
  });

  return (
    <main className="px-5 pt-12 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-muted hover:text-white">
          ← Settings
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold">Devices</h1>
      <p className="mt-1 text-sm text-muted">
        Each row is a passkey on one device. Enroll the device you&apos;re currently on, or remove
        passkeys you no longer trust.
      </p>

      <div className="mt-6">
        <AddPasskeyButton label="Enroll this device" />
      </div>

      <ul className="mt-8 space-y-2">
        {authenticators.length === 0 && (
          <li className="rounded-xl bg-surface p-4 text-sm text-muted">
            No passkeys yet. Enroll one above so you can sign in with Face ID / Touch ID next time.
          </li>
        )}
        {authenticators.map((a) => (
          <li
            key={a.credentialID}
            className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
          >
            <div>
              <div className="text-sm">
                {labelFor(a)}
                {a.credentialBackedUp && (
                  <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                    synced
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {a.credentialID.slice(0, 12)}…
              </div>
            </div>
            <DeleteDeviceButton credentialID={a.credentialID} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function labelFor(a: { credentialDeviceType: string; transports: string | null }): string {
  const transports = (a.transports ?? "").split(",").filter(Boolean);
  if (transports.includes("internal")) return "Built-in (Face ID / Touch ID / Windows Hello)";
  if (transports.includes("hybrid")) return "Phone (cross-device)";
  if (transports.includes("usb")) return "Security key (USB)";
  if (transports.includes("nfc")) return "Security key (NFC)";
  return a.credentialDeviceType === "multiDevice" ? "Synced passkey" : "Single-device passkey";
}
