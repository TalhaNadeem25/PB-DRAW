import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { authAPI } from "@/services/api";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        if (response.data.success) {
          setStatus("success");
          setMessage(response.data.message);
        } else {
          setStatus("error");
          setMessage(response.data.message || "Verification failed");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed. The link may have expired.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Layout>
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === "loading" && (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              {status === "success" && (
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{message}</p>

            {status === "success" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. You now have full access to all Pickle Rally features.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The verification link may have expired or already been used.
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                    Go to Login
                  </Button>
                  <Link to="/dashboard" className="text-sm text-primary hover:underline">
                    Request a new verification email
                  </Link>
                </div>
              </div>
            )}

            {status === "loading" && (
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
