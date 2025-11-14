import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  /* ---------------------------- LOGIN STATE ---------------------------- */
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /* ---------------------------- SIGNUP STATE --------------------------- */
  const [signup, setSignup] = useState({
    first: "",
    last: "",
    userId: "",
    pass: "",
    confirm: "",
  });

  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const passwordsMatch =
    signup.pass === signup.confirm && signup.pass.length > 0;

  /* ------------------------ REMEMBER ME LOADING ------------------------ */
  useEffect(() => {
    const saved = localStorage.getItem("rememberedIdentifier");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (saved) setIdentifier(saved);
    if (savedRemember) setRememberMe(true);
  }, []);

  /* ---------------------------- LOGIN LOGIC ---------------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await login(identifier, password);

      toast.success("Login successful!");

      if (rememberMe) {
        localStorage.setItem("rememberedIdentifier", identifier);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedIdentifier");
        localStorage.setItem("rememberMe", "false");
      }

      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid login credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- SIGNUP LOGIC --------------------------- */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms and Conditions.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          first_name: signup.first,
          last_name: signup.last,
          user_uid: signup.userId,
          password: signup.pass,
        }
      );

      toast.success(res.data?.message || "Account created successfully!");

      setSignup({
        first: "",
        last: "",
        userId: "",
        pass: "",
        confirm: "",
      });
      setAcceptedTerms(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------- UI ------------------------------- */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Campus Portal</h1>
          <p className="text-muted-foreground">
            AI-Integrated Campus Resources Platform
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ----------------------------- LOGIN TAB ----------------------------- */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <p className="text-xs text-muted-foreground mb-3">
                    Enter your credentials to access your account
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email or User ID</Label>
                    <Input
                      type="text"
                      placeholder="stu1234 or stu1234@gmail.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showLoginPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowLoginPass((s) => !s)}
                      >
                        {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm py-1">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Login
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* ----------------------------- SIGNUP TAB ---------------------------- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sign up for a new campus portal account
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={signup.first}
                        onChange={(e) =>
                          setSignup({ ...signup, first: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={signup.last}
                        onChange={(e) =>
                          setSignup({ ...signup, last: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      value={signup.userId}
                      onChange={(e) =>
                        setSignup({ ...signup, userId: e.target.value })
                      }
                      placeholder="stu1234 / fac98765"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupPass ? "text" : "password"}
                        value={signup.pass}
                        onChange={(e) =>
                          setSignup({ ...signup, pass: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupPass((s) => !s)}
                        tabIndex={-1}
                      >
                        {showSignupPass ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupConfirm ? "text" : "password"}
                        value={signup.confirm}
                        onChange={(e) =>
                          setSignup({ ...signup, confirm: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupConfirm((s) => !s)}
                        tabIndex={-1}
                      >
                        {showSignupConfirm ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {!passwordsMatch && signup.confirm && (
                      <p className="text-xs text-red-500">
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label className="text-sm text-muted-foreground">
                      I agree to the Terms and Conditions
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !passwordsMatch || !acceptedTerms}
                    className="w-full"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign Up
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
