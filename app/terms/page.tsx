import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Shield, AlertCircle, Users, Lock, Scale, Globe } from "lucide-react"

export default function TermsPage() {
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
              <h1 className="text-xl font-semibold text-gray-900">Terms and Conditions</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
            <p className="text-gray-600 mt-2">Last Updated: January 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-gray max-w-none p-8 space-y-8">
            {/* 1. Acceptance of Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">1. Acceptance of Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using this website and its services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must discontinue use of this website immediately. These terms constitute a legally binding agreement between you and the website operator.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time without prior notice. Your continued use of the website following any changes constitutes acceptance of the modified terms. It is your responsibility to review these terms periodically for updates.
              </p>
            </section>

            {/* 2. Description of Service */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">2. Description of Service</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                This website provides flight information obtained from the Schiphol Airport public API for educational and informational purposes only. The flight data is managed by airlines and airline handlers in the Central Information System Schiphol (CISS) and includes passenger flights and cargo flights (both scheduled and charter).
              </p>
              <p className="text-gray-700 leading-relaxed">
                All content is provided "as is" without warranty of any kind. Users are strongly advised to verify all flight information through official Schiphol or airline websites before making travel decisions. This service is independent and not affiliated with KLM Royal Dutch Airlines or Amsterdam Airport Schiphol.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-gray-700">
                  <strong>Important:</strong> This service uses the Schiphol API solely to help actual passengers or people picking up passengers. It may not be used for competitive analysis, EU Regulation 261/2004 claims, or commercial purposes unrelated to actual travel.
                </p>
              </div>
            </section>

            {/* 3. User Responsibilities */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">3. User Responsibilities</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                As a user of this website, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use the website only for lawful purposes and in accordance with these terms</li>
                <li>Not use the website in any way that could damage, disable, overburden, or impair the website</li>
                <li>Not attempt to gain unauthorized access to any portion of the website or any systems or networks connected to the website</li>
                <li>Not use any automated means to access the website for any purpose without express written permission</li>
                <li>Not collect or store personal data about other users</li>
                <li>Comply with all applicable local, state, national, and international laws and regulations</li>
              </ul>
            </section>

            {/* 4. Intellectual Property Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">4. Intellectual Property Rights</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, data compilations, and software, is the property of the website operator or its content suppliers and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website, except as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials</li>
                <li>You may store files that are automatically cached by your Web browser for display enhancement purposes</li>
                <li>You may print or download one copy of a reasonable number of pages of the website for your own personal, non-commercial use and not for further reproduction, publication, or distribution</li>
              </ul>
            </section>

            {/* 5. Disclaimer and Limitation of Liability */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">5. Disclaimer and Limitation of Liability</h2>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 font-semibold">
                  THE WEBSITE AND ITS CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by applicable law, we disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>The website will function uninterrupted, secure, or available at any particular time or location</li>
                <li>Any errors or defects will be corrected</li>
                <li>The website is free of viruses or other harmful components</li>
                <li>The results of using the website will meet your requirements</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                In no event shall the website operator, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind arising out of or in connection with your use, or inability to use, the website.
              </p>
            </section>

            {/* 6. Schiphol API Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">6. Schiphol API Terms and Conditions</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                This service uses the Schiphol Airport public REST API. By using this website, you agree to comply with the following Schiphol API-specific terms:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">6.1 Permitted Use</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>The flight information may only be used to help actual passengers or people picking up actual passengers</li>
                <li>Educational and informational purposes related to actual travel</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Prohibited Use</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700">The following uses are strictly prohibited:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                  <li>Competitive analysis of airlines or airports</li>
                  <li>Making claims regarding EU Regulation 261/2004 (passenger rights)</li>
                  <li>Commercial purposes not related to actual travel</li>
                  <li>Reselling or redistributing the data to third parties</li>
                  <li>Creating permanent databases of historical flight information</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Data Storage Limitations</h3>
              <p className="text-gray-700 leading-relaxed">
                In compliance with Schiphol API Terms:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Flight data may be cached for a maximum of 24 hours</li>
                <li>No permanent storage of flight data is permitted</li>
                <li>All cached data must be automatically purged after 24 hours</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">6.4 Data Distribution</h3>
              <p className="text-gray-700 leading-relaxed">
                Users are not allowed to distribute, sell, or otherwise share data obtained through this service with other parties. The data is provided for your personal use only in accordance with the intended purposes stated above.
              </p>
            </section>

            {/* 7. Indemnification */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">7. Indemnification</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You agree to defend, indemnify, and hold harmless the website operator, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms and Conditions or your use of the website.
              </p>
            </section>

            {/* 8. Privacy Considerations */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">8. Privacy Considerations</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Your use of our website is subject to our Privacy Policy. By using the website, you consent to all actions taken by us with respect to your information in compliance with the Privacy Policy. We are committed to protecting your privacy and handling any personal information we obtain from you with care and respect.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We process personal data in accordance with the General Data Protection Regulation (GDPR) (EU) 2016/679 and applicable Dutch data protection laws. We may collect certain information automatically when you visit our website, including your IP address, browser type, operating system, and browsing behavior. This information is used solely to improve our services and enhance your user experience.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You have the right to access, rectify, erase, restrict processing, and port your personal data. You also have the right to object to processing and to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).
              </p>
            </section>

            {/* 9. Termination */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">9. Termination</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your access to all or part of the website at any time, with or without cause, with or without notice, effective immediately. If you wish to terminate your agreement with us, you may simply discontinue using the website.
              </p>
              <p className="text-gray-700 leading-relaxed">
                All provisions of these Terms and Conditions which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* 10. Governing Law */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">10. Governing Law</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions and any dispute or claim arising out of or related to them, their subject matter, or their formation (in each case, including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the Netherlands, without giving effect to any choice or conflict of law provision or rule.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Any legal suit, action, or proceeding arising out of, or related to, these Terms and Conditions or the website shall be instituted exclusively in the courts of Amsterdam, the Netherlands. You waive any objection to the exercise of jurisdiction over you by such courts and to venue in such courts. The United Nations Convention on Contracts for the International Sale of Goods shall not apply.
              </p>
            </section>

            {/* 11. General Provisions */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold m-0">11. General Provisions</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <strong>Entire Agreement:</strong> These Terms and Conditions constitute the sole and entire agreement between you and the website operator regarding the website and supersede all prior and contemporaneous understandings, agreements, representations, and warranties.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Waiver and Severability:</strong> No waiver by the website operator of any term or condition set out in these Terms and Conditions shall be deemed a further or continuing waiver. If any provision of these Terms and Conditions is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Assignment:</strong> You may not assign or transfer these Terms and Conditions, by operation of law or otherwise, without our prior written consent. Any attempt by you to assign or transfer these Terms and Conditions without such consent will be null and void.
              </p>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us through the contact information provided on our website.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Back to top button */}
        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}