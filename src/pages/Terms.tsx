import Layout from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
              <h1 className="text-3xl font-display font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: January 2025</p>
            </div>
            <ScrollArea className="h-[70vh] pr-4">
                <div className="space-y-6 text-sm leading-relaxed">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground">
                      By accessing and using Pickle Rally ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                    <p className="text-muted-foreground">
                      Pickle Rally is a tournament management platform for pickleball events. Our Service allows:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Tournament organizers to create and manage pickleball tournaments</li>
                      <li>Players to discover, register, and participate in tournaments</li>
                      <li>Payment processing for tournament entry fees</li>
                      <li>Match scheduling, bracket management, and score tracking</li>
                      <li>Partner matching and team formation</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                    <p className="text-muted-foreground">
                      To use certain features of our Service, you must create an account. You agree to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Provide accurate, current, and complete information</li>
                      <li>Maintain the security of your password and account</li>
                      <li>Accept responsibility for all activities under your account</li>
                      <li>Notify us immediately of any unauthorized use</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">4. Tournament Registration & Payments</h2>
                    <p className="text-muted-foreground mb-2">
                      When registering for tournaments:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Entry fees are processed through Stripe, a secure payment processor</li>
                      <li>Refunds are subject to the tournament's cancellation policy</li>
                      <li>Standard refund policy: 100% (14+ days), 75% (7-14 days), 50% (2-7 days), 0% (less than 2 days)</li>
                      <li>Tournament organizers may set custom refund policies</li>
                      <li>Stripe processing fees may be deducted from refunds</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">5. Tournament Organizer Responsibilities</h2>
                    <p className="text-muted-foreground">
                      If you create tournaments as an organizer, you agree to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Provide accurate tournament information (dates, location, rules)</li>
                      <li>Honor advertised prize structures and awards</li>
                      <li>Maintain appropriate venue safety standards</li>
                      <li>Process refunds according to stated policies</li>
                      <li>Comply with Stripe Connect terms for receiving payments</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">6. Player Conduct</h2>
                    <p className="text-muted-foreground">
                      All players agree to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Follow tournament rules and official pickleball regulations</li>
                      <li>Treat other players, organizers, and staff with respect</li>
                      <li>Provide accurate skill level information</li>
                      <li>Show up for scheduled matches on time</li>
                      <li>Not engage in any form of harassment or unsportsmanlike conduct</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">7. Prohibited Activities</h2>
                    <p className="text-muted-foreground">
                      You may not:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Use the Service for any illegal purpose</li>
                      <li>Create fake accounts or misrepresent your identity</li>
                      <li>Manipulate tournament results or engage in match-fixing</li>
                      <li>Harass, threaten, or harm other users</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Use automated tools to scrape or access the Service</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
                    <p className="text-muted-foreground">
                      The Service and its original content, features, and functionality are owned by Pickle Rally and are protected by international copyright, trademark, and other intellectual property laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
                    <p className="text-muted-foreground">
                      Pickle Rally shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. This includes but is not limited to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>Tournament cancellations or schedule changes</li>
                      <li>Injuries occurring during tournament play</li>
                      <li>Disputes between players or with organizers</li>
                      <li>Technical issues or service interruptions</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">10. Disclaimer</h2>
                    <p className="text-muted-foreground">
                      The Service is provided "as is" without warranties of any kind. We do not guarantee that tournaments listed on our platform will occur as scheduled or meet your expectations.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
                    <p className="text-muted-foreground">
                      We may terminate or suspend your account at any time without prior notice for violations of these Terms. Upon termination, your right to use the Service will immediately cease.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
                    <p className="text-muted-foreground">
                      We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
                    <p className="text-muted-foreground">
                      If you have questions about these Terms of Service, please contact us at:
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Email: support@picklerally.com
                    </p>
                  </section>
                </div>
              </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
