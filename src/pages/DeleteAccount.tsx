import Layout from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const DeleteAccount = () => {
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
              <h1 className="text-3xl font-display font-bold">Account Deletion Request</h1>
              <p className="text-muted-foreground">PB Draw — Last updated: March 2026</p>
            </div>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6 text-sm leading-relaxed">

                <section>
                  <h2 className="text-xl font-semibold mb-3">How to Request Account Deletion</h2>
                  <p className="text-muted-foreground mb-3">
                    You can request deletion of your PB Draw account and associated data using any of the following methods:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">In-App (recommended):</span> Log in to the PB Draw app → go to <strong>Profile</strong> → scroll to the bottom → tap <strong>"Delete Account"</strong>. Your account will be permanently deleted immediately.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">By Email:</span> Send a request to{" "}
                      <a
                        href="mailto:support@pbdraw.com"
                        className="text-primary underline"
                      >
                        support@pbdraw.com
                      </a>{" "}
                      with the subject line <strong>"Account Deletion Request"</strong> and include the email address associated with your account. We will process your request within 30 days.
                    </li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">What Data Is Deleted</h2>
                  <p className="text-muted-foreground mb-2">Upon account deletion, the following data is permanently removed:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Your profile information (name, email, profile photo, skill level)</li>
                    <li>Your account credentials and login data</li>
                    <li>Your tournament registrations and team memberships</li>
                    <li>Your match history and scores associated with your profile</li>
                    <li>Your notifications and preferences</li>
                    <li>Any partner requests or invitations you created</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">What Data May Be Retained</h2>
                  <p className="text-muted-foreground mb-2">
                    Some data may be retained after account deletion for legal, financial, or operational reasons:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">Payment records:</span> Transaction history required for tax and accounting purposes is retained for up to 7 years as required by law. This data is anonymized where possible.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Tournament records:</span> Aggregated tournament results (scores, placements) may remain in tournament history in anonymized form.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Legal holds:</span> If your account is subject to an active dispute or legal proceeding, relevant data may be retained until resolution.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">Retention Period</h2>
                  <p className="text-muted-foreground">
                    Account and personal data is deleted within <strong>30 days</strong> of a confirmed deletion request. Payment and financial records may be retained for up to <strong>7 years</strong> as required by applicable law. All other retained data is anonymized within 30 days.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about data deletion or your privacy rights, contact us at{" "}
                    <a
                      href="mailto:support@pbdraw.com"
                      className="text-primary underline"
                    >
                      support@pbdraw.com
                    </a>.
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

export default DeleteAccount;
