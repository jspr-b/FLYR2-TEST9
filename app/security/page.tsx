import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Lock, Key, Server, AlertTriangle, CheckCircle, Globe, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-xl font-semibold text-gray-900">Security</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Security Information</CardTitle>
            <p className="text-gray-600 mt-2">How we protect your data and use the Schiphol API</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none p-8 space-y-8">
            {/* Overview */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">1. Security Overview</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We take the security of your data seriously. This page outlines our security measures, API usage practices, and compliance with data protection regulations. Our service uses industry-standard security practices to ensure safe and responsible use of flight information.
              </p>
            </section>

            {/* API Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">2. Schiphol API Security</h2>
              </div>
              
              <Alert className="mb-6">
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  This service uses the official Schiphol Airport REST API to obtain real-time flight information from the Central Information System Schiphol (CISS).
                </AlertDescription>
              </Alert>

              <h3 className="text-xl font-semibold mb-3">API Authentication</h3>
              <p className="text-gray-700 leading-relaxed">
                Our connection to the Schiphol API uses secure authentication:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>API credentials (APP_ID and APP_KEY) are securely stored in environment variables</li>
                <li>All API requests use HTTPS encryption</li>
                <li>Authentication headers are never exposed to end users</li>
                <li>We use API version 4 with header-based authentication for enhanced security</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">API Compliance</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Intended Use Compliance:</strong> In accordance with Schiphol API Terms, this service is used exclusively for helping actual passengers and people picking up passengers. We do not use the API for:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                  <li>Competitive analysis</li>
                  <li>Claims regarding EU Regulation 261/2004</li>
                  <li>Commercial purposes unrelated to actual travel</li>
                </ul>
              </div>
            </section>

            {/* Data Transmission Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">3. Data Transmission Security</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                All data transmission is protected using modern security standards:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>HTTPS Only:</strong> All connections use SSL/TLS encryption</li>
                <li><strong>HSTS Enabled:</strong> HTTP Strict Transport Security prevents downgrade attacks</li>
                <li><strong>Secure Headers:</strong> Security headers protect against common vulnerabilities</li>
                <li><strong>No Mixed Content:</strong> All resources loaded over secure connections</li>
              </ul>
            </section>

            {/* Data Storage Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">4. Data Storage Security</h2>
              </div>
              
              <Alert className="border-amber-200 bg-amber-50 mb-6">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-gray-700">
                  <strong>24-Hour Data Limit:</strong> In compliance with Schiphol API Terms, all flight data is cached for a maximum of 24 hours. No permanent flight history database is maintained.
                </AlertDescription>
              </Alert>

              <p className="text-gray-700 leading-relaxed">
                Our data storage practices ensure minimal data retention:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Flight data is temporarily cached in memory for performance</li>
                <li>Cache automatically expires after 5 minutes for real-time accuracy</li>
                <li>No personal user data is stored on servers</li>
                <li>Consent status stored only in browser localStorage</li>
                <li>All cached data is automatically purged after 24 hours</li>
              </ul>
            </section>

            {/* Application Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">5. Application Security Measures</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our application implements multiple layers of security:
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Input Validation</h4>
                  </div>
                  <p className="text-gray-600">All user inputs are validated and sanitized to prevent injection attacks</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Rate Limiting</h4>
                  </div>
                  <p className="text-gray-600">API requests are rate-limited to prevent abuse and ensure fair usage</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Error Handling</h4>
                  </div>
                  <p className="text-gray-600">Secure error handling prevents information leakage</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Regular Updates</h4>
                  </div>
                  <p className="text-gray-600">Dependencies are regularly updated to patch security vulnerabilities</p>
                </div>
              </div>
            </section>

            {/* API Rate Limiting */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">6. API Usage and Rate Limits</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To ensure responsible API usage and maintain service availability:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>API calls are cached to minimize requests to Schiphol servers</li>
                <li>Pagination is properly implemented (20 results per page)</li>
                <li>Automatic retry logic with exponential backoff</li>
                <li>Real-time data refresh every 10 minutes</li>
                <li>Background cache warming to improve performance</li>
              </ul>

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold mb-2">API Request Headers</h4>
                <pre className="text-sm text-gray-600 overflow-x-auto">
{`Accept: application/json
ResourceVersion: v4
app_id: [SECURED]
app_key: [SECURED]`}
                </pre>
              </div>
            </section>

            {/* User Privacy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">7. User Privacy Protection</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We implement strict privacy protection measures:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>No user accounts or registration required</li>
                <li>No personal travel data collected or stored</li>
                <li>No tracking cookies or analytics</li>
                <li>Consent data expires automatically after 24 hours</li>
                <li>All data processing complies with GDPR requirements</li>
              </ul>
            </section>

            {/* Incident Response */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">8. Security Incident Response</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                In the event of a security incident:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Immediate investigation and containment</li>
                <li>Assessment of impact and affected data</li>
                <li>Notification to affected users within 72 hours (GDPR requirement)</li>
                <li>Remediation and prevention measures</li>
                <li>Documentation and lessons learned</li>
              </ul>
            </section>

            {/* Responsible Disclosure */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">9. Responsible Disclosure</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We welcome security researchers to responsibly disclose vulnerabilities. If you discover a security issue:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Do not exploit the vulnerability</li>
                <li>Provide detailed information about the issue</li>
                <li>Allow reasonable time for patching</li>
                <li>Do not disclose publicly until fixed</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Please report security issues through our contact information.
              </p>
            </section>

            {/* Compliance */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">10. Compliance and Certifications</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our security practices comply with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>Dutch Data Protection Laws</li>
                <li>Schiphol API Terms and Conditions</li>
                <li>Industry best practices for web security</li>
              </ul>
            </section>

            {/* Contact for Security */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-4">Security Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For security concerns, vulnerability reports, or questions about our security practices, please contact us through the information provided on our website. We take all security reports seriously and will respond promptly.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Back to home button */}
        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}