import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Lock, Eye, Database, Clock, Globe, AlertCircle, UserCheck } from "lucide-react"

export default function PrivacyPage() {
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
              <h1 className="text-xl font-semibold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-gray-600 mt-2">Last Updated: January 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none p-8 space-y-8">
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">1. Introduction</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy explains how we collect, use, and protect your personal data when you use our educational flight information service. We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) (EU) 2016/679 and Dutch data protection laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This service is an independent educational platform and is not affiliated with KLM Royal Dutch Airlines or Amsterdam Airport Schiphol, although it uses publicly available data from the Schiphol API.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">2. Data We Collect</h2>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Automatically Collected Data</h3>
              <p className="text-gray-700 leading-relaxed">
                When you visit our website, we automatically collect certain technical information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>IP Address:</strong> Used for security and geographic analysis</li>
                <li><strong>Browser Type and Version:</strong> To ensure compatibility</li>
                <li><strong>Operating System:</strong> For technical support purposes</li>
                <li><strong>Browsing Behavior:</strong> Pages visited, time spent on site</li>
                <li><strong>Referral Source:</strong> How you arrived at our website</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Consent Data</h3>
              <p className="text-gray-700 leading-relaxed">
                We store your consent acceptance in your browser's local storage:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Timestamp of consent acceptance</li>
                <li>Consent status (accepted/declined)</li>
                <li>This data expires after 24 hours</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Flight Data</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700">
                  All flight information displayed is obtained from the Schiphol Airport public API. We do not store personal travel information or booking details. Flight data is cached for a maximum of 24 hours in compliance with Schiphol API terms.
                </p>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">3. How We Use Your Data</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We use the collected data for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To provide and maintain our educational flight information service</li>
                <li>To improve user experience and website functionality</li>
                <li>To analyze usage patterns and optimize performance</li>
                <li>To ensure security and prevent abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not sell, rent, or share your personal data with third parties for marketing purposes.
              </p>
            </section>

            {/* Data Storage */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">4. Data Storage and Retention</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                In compliance with Schiphol API Terms and Conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Flight data obtained from the Schiphol API is cached for a maximum of 24 hours</li>
                <li>We do not create permanent databases of historical flight information</li>
                <li>Technical logs are retained for 30 days for security purposes</li>
                <li>Consent data expires automatically after 24 hours</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-gray-700 font-semibold">
                  Important: All flight data is temporary and for educational display purposes only. We do not maintain long-term flight history databases.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">5. Your Rights Under GDPR</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Under the General Data Protection Regulation, you have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided at the bottom of this policy.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">6. Cookies and Local Storage</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We use minimal cookies and local storage for essential functionality:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Consent Storage:</strong> To remember your consent status (expires after 24 hours)</li>
                <li><strong>Session Cookies:</strong> For basic website functionality</li>
                <li><strong>No Tracking Cookies:</strong> We do not use advertising or tracking cookies</li>
              </ul>
            </section>

            {/* Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">7. Data Security</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Encryption of sensitive data</li>
              </ul>
            </section>

            {/* Third-Party Data */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">8. Third-Party Data Sources</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                This service uses the Schiphol Airport public API to obtain flight information. The flight data is:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Managed by airlines and airline handlers in the Central Information System Schiphol (CISS)</li>
                <li>Provided for educational purposes only</li>
                <li>Subject to Schiphol's API Terms and Conditions</li>
                <li>Used only to help actual passengers or people picking up passengers</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-gray-700">
                  <strong>Prohibited Uses:</strong> The flight data may not be used for competitive analysis, claims regarding EU Regulation 261/2004, or other commercial uses not related to actual travel.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">9. Children's Privacy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Our service is not directed to children under the age of 16. We do not knowingly collect personal data from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">10. Changes to This Policy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Data Protection Officer */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">11. Data Protection Authority</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You have the right to lodge a complaint with the Dutch Data Protection Authority:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700">
                  <strong>Autoriteit Persoonsgegevens</strong><br />
                  Postbus 93374<br />
                  2509 AJ Den Haag<br />
                  The Netherlands<br />
                  <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    autoriteitpersoonsgegevens.nl
                  </a>
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or your personal data, please contact us through the contact information provided on our website.
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