import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUserId, setSignupUserId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const passwordsMatch =
    signupPassword === signupConfirmPassword && signupPassword.length > 0;

  // Remember me preload
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail) setLoginEmail(savedEmail);
    if (savedRemember) setRememberMe(true);
  }, []);

  // -------------------- HANDLE LOGIN --------------------
const handleLogin = async (e) => {
  e.preventDefault();
  if (isLoading) return;
  setIsLoading(true);

  try {
    await login(loginEmail, loginPassword);
    toast.success('Login successful!');
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', loginEmail);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.setItem('rememberMe', 'false');
    }
    navigate('/');
  } catch (err) {
    const msg = err.response?.data?.message || 'Invalid credentials';
    toast.error(msg);
  } finally {
    setIsLoading(false);
  }
};


  // -------------------- HANDLE SIGNUP --------------------
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please accept the Terms and Conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        first_name: signupFirstName,
        last_name: signupLastName,
        user_uid: signupUserId,
        password: signupPassword,
      });

      toast.success(res.data?.message || 'Account created successfully! You can now log in.');

      // Reset form
      setSignupFirstName('');
      setSignupLastName('');
      setSignupUserId('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setAcceptedTerms(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------- UI --------------------
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
          <p className="text-muted-foreground">AI-Integrated Campus Resources Platform</p>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------------- LOGIN ---------------- */}
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
                      placeholder="adm0001 or adm0001@campus.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowLoginPassword((v) => !v)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* ---------------- SIGNUP ---------------- */}
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
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      value={signupUserId}
                      onChange={(e) => setSignupUserId(e.target.value)}
                      placeholder="stu1234 / fac1234 / adm0001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupPassword((prev) => !prev)}
                        tabIndex={-1}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupConfirm ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupConfirm((prev) => !prev)}
                        tabIndex={-1}
                      >
                        {showSignupConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {!passwordsMatch && signupConfirmPassword && (
                      <p className="text-xs text-red-500">Passwords don't match.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      required
                    />
                    <label className="text-sm text-muted-foreground select-none">
                      I agree to the Terms and Conditions
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !passwordsMatch || !acceptedTerms}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
