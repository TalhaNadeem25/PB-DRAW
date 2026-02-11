import Layout from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="glass-card-hover rounded-2xl p-8 animate-fade-in">
            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </div>
            <ScrollArea className="h-[70vh] pr-4">
                <div className="space-y-6 text-sm leading-relaxed">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                    <p className="text-muted-foreground">
                      Pickle Rally ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our tournament management platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

                    <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
                    <p className="text-muted-foreground">
                      When you create an account or use our Service, we may collect:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Name and email address</li>
                      <li>Phone number (optional)</li>
                      <li>Skill level and playing preferences</li>
                      <li>Location (city, state)</li>
                      <li>Profile photo (optional)</li>
                      <li>Payment information (processed securely by Stripe)</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">Tournament Data</h3>
                    <p className="text-muted-foreground">
                      We collect data related to your tournament activities:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Tournament registrations and participation history</li>
                      <li>Match results and scores</li>
                      <li>Team formations and partner connections</li>
                      <li>Check-in records</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">Automatically Collected Information</h3>
                    <p className="text-muted-foreground">
                      When you use our Service, we automatically collect:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Device information (browser type, operating system)</li>
                      <li>IP address</li>
                      <li>Usage data (pages visited, features used)</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                    <p className="text-muted-foreground">
                      We use the collected information to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Provide and maintain our Service</li>
                      <li>Process tournament registrations and payments</li>
                      <li>Send transactional emails (confirmations, receipts, notifications)</li>
                      <li>Match you with compatible partners</li>
                      <li>Generate tournament brackets and schedules</li>
                      <li>Track your statistics and tournament history</li>
                      <li>Improve and personalize your experience</li>
                      <li>Respond to your inquiries and support requests</li>
                      <li>Prevent fraud and ensure security</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
                    <p className="text-muted-foreground mb-2">
                      We may share your information with:
                    </p>

                    <h3 className="text-lg font-medium mt-4 mb-2">Tournament Organizers</h3>
                    <p className="text-muted-foreground">
                      When you register for a tournament, organizers can see your name, email, skill level, and registration status to manage their event.
                    </p>

                    <h3 className="text-lg font-medium mt-4 mb-2">Other Players</h3>
                    <p className="text-muted-foreground">
                      Your public profile (name, skill level, location) may be visible to other players for partner matching and tournament participation.
                    </p>

                    <h3 className="text-lg font-medium mt-4 mb-2">Service Providers</h3>
                    <p className="text-muted-foreground">
                      We work with third-party services including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Stripe - Payment processing</li>
                      <li>Cloudinary - Image storage</li>
                      <li>Email service providers - Transactional emails</li>
                      <li>Analytics providers - Usage analysis</li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 mb-2">Legal Requirements</h3>
                    <p className="text-muted-foreground">
                      We may disclose information if required by law or to protect our rights, privacy, safety, or property.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
                    <p className="text-muted-foreground">
                      We implement appropriate security measures to protect your information:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Encrypted data transmission (HTTPS/TLS)</li>
                      <li>Secure password hashing (bcrypt)</li>
                      <li>Payment data handled by PCI-compliant Stripe</li>
                      <li>Regular security audits and updates</li>
                      <li>Access controls and authentication</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
                    <p className="text-muted-foreground">
                      You have the right to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li><strong>Access</strong> - Request a copy of your personal data</li>
                      <li><strong>Correct</strong> - Update inaccurate information in your profile</li>
                      <li><strong>Delete</strong> - Request deletion of your account and data</li>
                      <li><strong>Opt-out</strong> - Unsubscribe from marketing communications</li>
                      <li><strong>Export</strong> - Receive your data in a portable format</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      To exercise these rights, please contact us at privacy@picklerally.com.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
                    <p className="text-muted-foreground">
                      We use cookies and similar technologies to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Keep you logged in</li>
                      <li>Remember your preferences</li>
                      <li>Analyze usage patterns</li>
                      <li>Improve our Service</li>
                    </ul>
                    <p className="text-muted-foreground mt-2">
                      You can control cookies through your browser settings, but disabling them may affect functionality.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
                    <p className="text-muted-foreground">
                      We retain your information for as long as your account is active or as needed to provide services. Tournament and match data may be retained for historical records. We will delete your data upon request, except where retention is required by law.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
                    <p className="text-muted-foreground">
                      Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
                    <p className="text-muted-foreground">
                      Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">11. California Privacy Rights (CCPA)</h2>
                    <p className="text-muted-foreground">
                      California residents have additional rights including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Right to know what personal information is collected</li>
                      <li>Right to request deletion of personal information</li>
                      <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
                      <li>Right to non-discrimination for exercising privacy rights</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
                    <p className="text-muted-foreground">
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Significant changes will be communicated via email.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
                    <p className="text-muted-foreground">
                      If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                    </p>
                    <div className="text-muted-foreground mt-2 space-y-1">
                      <p>Email: privacy@picklerally.com</p>
                      <p>Support: support@picklerally.com</p>
                    </div>
                  </section>
                </div>
              </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
