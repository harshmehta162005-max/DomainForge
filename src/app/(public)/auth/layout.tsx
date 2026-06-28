/**
 * The auth page is a full-screen split layout with its own logo.
 * It must NOT have the shared Header on top — this layout overrides
 * the parent (public) layout's Header by wrapping only the children.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
