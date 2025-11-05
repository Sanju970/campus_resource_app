import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('student');
  const [rememberMe, setRememberMe] = useState(false);

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupUserId, setSignupUserId] = useState('');
  //const [signupBio, setSignupBio] = useState('');
  const [signupRole, setSignupRole] = useState('student');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  //email
  const isEduEmail = /^[^\s@]+@[^\s@]+\.edu$/i.test(signupEmail.trim());
  
  const passwordsMatch =
    signupPassword.length > 0 && signupPassword === signupConfirmPassword;

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail) setLoginEmail(savedEmail);
    if (savedRemember) setRememberMe(true);
  }, []);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (password.length === 0)
      return { strength: 0, label: '', color: '' };
    if (password.length < 6)
      return { strength: 1, label: 'Weak', color: 'text-red-500' };
    if (password.length < 8)
      return { strength: 2, label: 'Fair', color: 'text-orange-500' };

    let strength = 2;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength >= 4)
      return { strength: 3, label: 'Strong', color: 'text-green-500' };
    return { strength: 2, label: 'Fair', color: 'text-orange-500' };
  };

  const passwordStrength = getPasswordStrength(signupPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword, loginRole);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginEmail);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.setItem('rememberMe', 'false');
      }
      toast.success('Welcome back!');
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (signupPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Please accept the Terms and Conditions');
      return;
    }

    setIsLoading(true);

    try {
      await signup(
        signupEmail,
        signupPassword,
        `${signupFirstName} ${signupLastName}`,
        signupRole,
        {
          userId: signupUserId,
          // bio: signupBio,
        }
      );
      toast.success('Account created successfully!');
    } catch {
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Auth Forms */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* -------------------- LOGIN TAB -------------------- */}
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="user@campus.edu"
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
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={loginRole} onValueChange={setLoginRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <button
                      type="button"
                      className="text-sm underline hover:no-underline"
                      onClick={() =>
                        loginEmail
                          ? toast.message('Password reset', {
                              description: `We would email a reset link to ${loginEmail}.`,
                            })
                          : toast.info('Enter your email first.')
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* -------------------- SIGNUP TAB -------------------- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sign up for a new campus portal account
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* First and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        placeholder="John"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        placeholder="Doe"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <Label>User Id</Label>
                    <Input
                      placeholder="e.g., STU1234 or FAC5678"
                      value={signupUserId}
                      onChange={(e) => setSignupUserId(e.target.value)}
                      required
                    />
                  </div>

                 {/* Bio */}
                  {/*<div className="space-y-2">
                    <Label>Bio (Optional)</Label>
                    <textarea
                      rows="3"
                      placeholder="Tell us a bit about yourself..."
                      className="border rounded-md p-2 w-full text-sm"
                      value={signupBio}
                      onChange={(e) => setSignupBio(e.target.value)}
                    />
                  </div>*/}
                

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="user@campus.edu"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                    {!isEduEmail && signupEmail && (
                      <p className="text-xs text-orange-600">
                        Please use your campus email (e.g., user@campus.edu).
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        minLength={8}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupPassword((v) => !v)}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength.strength === 1
                                ? 'bg-red-500 w-1/3'
                                : passwordStrength.strength === 2
                                ? 'bg-orange-500 w-2/3'
                                : 'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        type={showSignupConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center pr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignupConfirm((v) => !v)}
                      >
                        {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!passwordsMatch && signupConfirmPassword && (
                      <p className="text-xs text-red-500">Passwords don't match.</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label>Role (for demo)</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground select-none">
                      I agree to the Terms and Conditions and Privacy Policy
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isLoading ||
                      !acceptedTerms ||
                      !passwordsMatch ||
                      !isEduEmail ||
                      !signupFirstName ||
                      !signupLastName ||
                      !signupUserId
                    }
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Demo Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              This is a demo application. Use any email and password to login. <br />
              Facing issues? Contact admindemo@campus.edu
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
