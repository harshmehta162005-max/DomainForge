/**
 * Public layout — no Header here.
 * The landing page renders its own inline nav (it's a full-bleed hero page).
 * The auth page renders its own logo inside the split layout.
 * The generate page uses ResultsHeader.
 * Header is added only in (app) layout for dashboard routes.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  )
}
