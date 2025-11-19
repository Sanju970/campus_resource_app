import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Shield,
  Edit,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  PenIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Move PasswordInput OUTSIDE the parent component
const PasswordInput = ({ placeholder, value, onChange, show, toggleShow }) => (
  <div className="relative w-full">
    <Input
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pr-10"
    />
    <button
      type="button"
      onClick={toggleShow}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </div>
);

function ChangePasswordSection() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordHints, setPasswordHints] = useState([]);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const evaluatePassword = (pwd) => {
    const hints = [];
    if (pwd.length < 8) hints.push('Must be at least 8 characters long');
    if (!/[A-Z]/.test(pwd)) hints.push('Add at least one uppercase letter (A–Z)');
    if (!/[a-z]/.test(pwd)) hints.push('Add at least one lowercase letter (a–z)');
    if (!/[0-9]/.test(pwd)) hints.push('Add at least one number (0–9)');
    if (!/[@$!%*?&]/.test(pwd))
      hints.push('Add at least one special character (@$!%*?&)');
    setPasswordHints(hints);
  };

  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword)
      return toast.error('All fields are required');
    if (newPassword !== confirmPassword)
      return toast.error('New passwords do not match');
    if (!strongPasswordRegex.test(newPassword))
      return toast.error('Password does not meet strength requirements.');

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/change-password', {
        user_uid: user.user_uid,
        oldPassword,
        newPassword,
      });
      toast.success(res.data.message || 'Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHints([]);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      {/* Dropdown Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div>
          <p>Change Password</p>
          <p className="text-sm text-muted-foreground">
            Update your account password
          </p>
        </div>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>

      {/* Dropdown Content */}
      {open && (
        <div className="mt-4 space-y-3">
          <PasswordInput
            placeholder="Old Password"
            value={oldPassword}
            onChange={setOldPassword}
            show={showOld}
            toggleShow={() => setShowOld(!showOld)}
          />
          <PasswordInput
            placeholder="New Password"
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              evaluatePassword(val);
            }}
            show={showNew}
            toggleShow={() => setShowNew(!showNew)}
          />
          <PasswordInput
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
          />

          {/* Submit button - right below confirm password */}
          
          <Button
            onClick={handlePasswordUpdate}
            disabled={loading}
            variant="outline" size="sm"
            className="w-full bg-blue-600 text-black hover:bg-blue-700"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>

          {/* Show missing hints BELOW the button */}
          {passwordHints.length > 0 && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              <p className="font-medium mb-1">Missing:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {passwordHints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function EditProfileSection() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);

  const [first, setFirst] = useState(user?.first_name || "");
  const [last, setLast] = useState(user?.last_name || "");
  const [bio, setBio] = useState(user?.bio || "");

  const [loading, setLoading] = useState(false);

  const submitUpdate = async () => {
    if (!first.trim() || !last.trim()) {
      return toast.error("First and Last name are required");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/user/update-profile",
        {
          user_id: user.user_id,
          first_name: first,
          last_name: last,
          bio,
        }
      );

      toast.success(res.data.message);

      // Update user everywhere
      const updated = {
        ...user,
        first_name: first,
        last_name: last,
        bio,
      };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      setOpen(false);
    } catch (err) {
      toast.error("Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div>
          <p>Edit Profile</p>
          <p className="text-sm text-muted-foreground">
            Change your name or bio
          </p>
        </div>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>

      {/* Body */}
      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <Label>First Name</Label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>

          <div>
            <Label>Last Name</Label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <Button
            onClick={submitUpdate}
            disabled={loading}
            variant="outline" size="sm"
            className="w-full bg-blue-600 text-black hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  function NotificationToggle() {
    const { user, setUser } = useAuth();
    const [enabled, setEnabled] = useState(user?.email_notifications);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
      try {
        setLoading(true);
        const res = await axios.post(
          "http://localhost:5000/api/user/update-notifications",
          {
            user_id: user.user_id,
            enabled: !enabled,
          }
        );

        toast.success(res.data.message);

        // update React & localStorage
        const updated = { ...user, email_notifications: !enabled };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));

        setEnabled(!enabled);
      } catch (err) {
        toast.error("Failed to update setting");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {enabled ? "Disable" : "Enable"}
      </Button>
    );
  }

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'student':
        return GraduationCap;
      case 'faculty':
        return Briefcase;
      case 'admin':
        return Shield;
      default:
        return GraduationCap;
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'student':
        return 'bg-blue-500';
      case 'faculty':
        return 'bg-green-500';
      case 'admin':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1>Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className={`${getRoleBadgeColor()} text-3xl`}>
                {user?.first_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2>{`${user?.first_name} ${user?.last_name}`}</h2>
                    <Badge variant="secondary" className="capitalize">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user?.role}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>User ID: {user?.user_uid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PenIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Bio: {user?.bio}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditProfileSection />
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p>Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about your account
              </p>
            </div>
            <NotificationToggle />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p>Privacy Settings</p>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile
              </p>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>

          {/* Change Password Dropdown Section */}
          <ChangePasswordSection />
        </CardContent>
      </Card>
    </div>
  );
}
