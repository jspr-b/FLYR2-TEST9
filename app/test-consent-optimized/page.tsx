export default function TestConsentOptimized() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Consent Optimization</h1>
      <p className="mb-4">This page tests the optimized consent flow where data is preloaded while the consent modal is shown.</p>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold mb-2">How it works:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>When you visit a protected page (like /dashboard), the consent modal appears</li>
            <li>While the modal is shown, API calls start loading data in the background</li>
            <li>When you accept consent, the page refreshes with data already loaded/loading</li>
            <li>This eliminates the double wait time (consent acceptance + data loading)</li>
          </ol>
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Test it:</h2>
          <p>Clear your consent and visit the <a href="/dashboard" className="text-blue-600 underline">Dashboard</a> to see the optimized flow in action.</p>
          <p className="mt-2">Or use the <a href="/clear-consent" className="text-red-600 underline">Clear Consent</a> page first.</p>
        </div>
      </div>
    </div>
  )
}