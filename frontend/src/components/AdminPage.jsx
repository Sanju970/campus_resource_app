import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import { Trash2, Plus, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const API_BASE = 'http://localhost:5000/api'; // ✅ correct base

  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_uid: '',
    role_id: 1,
    password: '',
  });

  // -------------------- FETCH USERS --------------------
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = showInactive
        ? `${API_BASE}/admin/users?all=true`
        : `${API_BASE}/admin/users`;
      const res = await axios.get(url);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showInactive]);

  // -------------------- ADD USER --------------------
  const handleAddUser = async () => {
    const { first_name, last_name, email, user_uid, role_id, password } = newUser;
    if (!first_name || !last_name || !email || !user_uid) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/admin/create`, {
        first_name,
        last_name,
        email,
        user_uid,
        role_id,
        password,
      });

      setUsers((prev) => [...prev, res.data.user]);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        user_uid: '',
        role_id: 1,
        password: '',
      });

      toast.success(
        `User added successfully. Temporary password: ${res.data.user.dummy_password}`
      );
    } catch (err) {
      console.error('Add user error:', err);
      toast.error(err.response?.data?.message || 'Error adding user');
    }
  };

  // -------------------- DEACTIVATE USER --------------------
  const handleDeactivateUser = async (id) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${id}/deactivate`);
      toast.success('User deactivated successfully.');
      fetchUsers();
    } catch (err) {
      console.error('Deactivate error:', err);
      toast.error('Failed to deactivate user');
    }
  };

  // -------------------- REACTIVATE USER --------------------
  const handleActivateUser = async (id) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${id}/activate`);
      toast.success('User reactivated successfully.');
      fetchUsers();
    } catch (err) {
      console.error('Activate error:', err);
      toast.error('Failed to reactivate user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInactive((p) => !p)}>
            {showInactive ? 'Show Active Only' : 'Show All Users'}
          </Button>
          <Button variant="secondary" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Add New User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Add New User</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="First Name"
            value={newUser.first_name}
            onChange={(e) =>
              setNewUser({ ...newUser, first_name: e.target.value })
            }
          />
          <Input
            placeholder="Last Name"
            value={newUser.last_name}
            onChange={(e) =>
              setNewUser({ ...newUser, last_name: e.target.value })
            }
          />
          <Input
            placeholder="user@campus.edu"
            value={newUser.email}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
          />
          <Input
            placeholder="User ID"
            value={newUser.user_uid}
            onChange={(e) =>
              setNewUser({ ...newUser, user_uid: e.target.value })
            }
          />

          {/* Role Dropdown */}
          <Select
            value={String(newUser.role_id)}
            onValueChange={(value) =>
              setNewUser({ ...newUser, role_id: Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Student</SelectItem>
              <SelectItem value="2">Faculty</SelectItem>
              <SelectItem value="3">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Password (optional)"
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />

          <Button
            className="col-span-1 md:col-span-4"
            onClick={handleAddUser}
          >
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </CardContent>
      </Card>

      {/* Existing Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {showInactive ? 'All Users' : 'Active Users'} ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table className="w-full text-sm text-center align-middle">
                <TableHeader className="sticky top-0 bg-muted/60">
                  <TableRow>
                    <TableHead>User UID</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.user_uid}</TableCell>
                      <TableCell>{u.first_name}</TableCell>
                      <TableCell>{u.last_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.role_id === 1
                          ? 'Student'
                          : u.role_id === 2
                          ? 'Faculty'
                          : 'Admin'}
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateUser(u.user_id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateUser(u.user_id)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
