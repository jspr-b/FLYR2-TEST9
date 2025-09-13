import { ConsentRequired } from '@/components/consent-required'

export default function TestConsentStatic() {
  return (
    <ConsentRequired>
      <div className="p-8">
        <h1 className="text-2xl font-bold">This content is protected</h1>
        <p>You should not see this without consent</p>
      </div>
    </ConsentRequired>
  )
}