import { cookies } from 'next/headers'
import { getConsent } from '@/lib/consent-cookies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function TestCookiesPage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const consent = await getConsent()
  
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cookie Consent Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Consent Status:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(consent, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">All Cookies:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(allCookies.map(c => ({ name: c.name, value: c.value })), null, 2)}
            </pre>
          </div>
          
          <div className="flex gap-4">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
            <form action="/api/clear-cookies" method="POST">
              <Button type="submit" variant="destructive">
                Clear All Cookies
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}