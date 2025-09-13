import { headers } from 'next/headers'
import { PageConsentWrapper } from './page-consent-wrapper'

export async function SelectiveConsentProvider({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  return (
    <PageConsentWrapper pathname={pathname}>
      {children}
    </PageConsentWrapper>
  )
}