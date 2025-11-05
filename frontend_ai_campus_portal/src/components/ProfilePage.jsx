import { useState } from 'react';
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
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState('');

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

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1>Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className={`${getRoleBadgeColor()} text-3xl`}>
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2>{user?.name}</h2>
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {user?.joinDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.department || 'Not specified'}</span>
                </div>
                {user?.studentId && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {user.studentId}</span>
                  </div>
                )}
                {user?.facultyId && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {user.facultyId}</span>
                  </div>
                )}
                {user?.adminId && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {user.adminId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-Specific Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'student' && 'Academic Information'}
            {user?.role === 'faculty' && 'Faculty Information'}
            {user?.role === 'admin' && 'Administrative Information'}
          </CardTitle>
          <CardDescription>
            Details specific to your role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.role === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Year</p>
                <p>Sophomore</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Major</p>
                <p>Computer Science</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GPA</p>
                <p>3.7</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Completed</p>
                <p>64 / 120</p>
              </div>
            </div>
          )}

          {user?.role === 'faculty' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p>{user?.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p>Associate Professor</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Office</p>
                <p>Science Building, Room 401</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>(555) 123-4567</p>
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p>{user?.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p>Campus Administrator</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Office</p>
                <p>Admin Building, Room 501</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>555-403-9624</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p>Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p>Privacy Settings</p>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p>Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
