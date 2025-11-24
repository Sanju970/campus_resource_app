// src/components/ForgotPasswordPage.jsx
import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error("Please enter your User ID or Email.");
      return;
    }

    try {
      setIsLoading(true);

      await api.post("/auth/forgot-password", {
        identifier,
      });

      toast.success("A password reset link has been sent to your email.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>User ID or Email</Label>
                <Input
                  value={identifier}
                  placeholder="stu1234 or user@gmail.com"
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full text-center text-xs text-muted-foreground mt-2 hover:underline"
              >
                Back to login
              </button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
