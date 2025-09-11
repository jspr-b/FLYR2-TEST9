import { ConsentProvider } from "@/components/providers/consent-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ConsentProvider>{children}</ConsentProvider>
}