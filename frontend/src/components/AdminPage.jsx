import { useState } from 'react';
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
import { Trash2, Plus } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([
    {
      id: '1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@campus.edu',
      userId: 'alice01',
      role: 'student',
      department: 'Computer Science (CSE)',
    },
    {
      id: '2',
      firstName: 'Dr.',
      lastName: 'Smith',
      email: 'smith@campus.edu',
      userId: 'smith02',
      role: 'faculty',
      department: 'Engineering (ECE)',
    },
  ]);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userId: '',
    role: 'student',
    department: '',
  });

  const handleAddUser = () => {
    const { firstName, lastName, email, userId, department } = newUser;
    if (!firstName || !lastName || !email || !userId || !department) {
      toast.error('Please fill in all fields.');
      return;
    }
    setUsers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...newUser },
    ]);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      userId: '',
      role: 'student',
      department: '',
    });
    toast.success('User added successfully.');
  };

  const handleDeleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.info('User deleted successfully.');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">User Management</h1>
      </div>

      {/* Add New User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Add New User</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="First Name"
            value={newUser.firstName}
            onChange={(e) =>
              setNewUser({ ...newUser, firstName: e.target.value })
            }
          />
          <Input
            placeholder="Last Name"
            value={newUser.lastName}
            onChange={(e) =>
              setNewUser({ ...newUser, lastName: e.target.value })
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
            value={newUser.userId}
            onChange={(e) =>
              setNewUser({ ...newUser, userId: e.target.value })
            }
          />

          {/* Role Dropdown */}
          <Select
            value={newUser.role}
            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Dropdown */}
          <Select
            value={newUser.department}
            onValueChange={(value) =>
              setNewUser({ ...newUser, department: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Computer Science (CSE)">
                Computer Science (CSE)
              </SelectItem>
              <SelectItem value="Electronics (ECE)">
                Electronics (ECE)
              </SelectItem>
              <SelectItem value="Information Technology (IT)">
                Information Technology (IT)
              </SelectItem>
              <SelectItem value="Mechanical Engineering (MECH)">
                Mechanical Engineering (MECH)
              </SelectItem>
              <SelectItem value="Civil Engineering (CIVIL)">
                Civil Engineering (CIVIL)
              </SelectItem>
              <SelectItem value="Electrical & Electronics (EEE)">
                Electrical & Electronics (EEE)
              </SelectItem>
            </SelectContent>
          </Select>

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
            Existing Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto relative">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table className="w-full table-fixed border-collapse text-sm text-center align-middle">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[25%]" />
                  <col className="w-[10%]" />
                  <col className="w-[20%]" />
                  <col className="w-[5%]" />
                </colgroup>

                <TableHeader className="sticky top-0 bg-muted/60">
                  <TableRow className="border-b">
                    <TableHead className="px-4 py-3">User ID</TableHead>
                    <TableHead className="px-4 py-3">First Name</TableHead>
                    <TableHead className="px-4 py-3">Last Name</TableHead>
                    <TableHead className="px-4 py-3">Email</TableHead>
                    <TableHead className="px-4 py-3">Role</TableHead>
                    <TableHead className="px-4 py-3">Department</TableHead>
                    <TableHead className="px-4 py-3">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="px-4 py-3 align-middle font-mono text-muted-foreground">
                        {u.userId}
                      </TableCell>
                      <TableCell className="px-4 py-3">{u.firstName}</TableCell>
                      <TableCell className="px-4 py-3">{u.lastName}</TableCell>
                      <TableCell className="px-4 py-3">{u.email}</TableCell>
                      <TableCell className="px-4 py-3 capitalize">{u.role}</TableCell>
                      <TableCell className="px-4 py-3">{u.department}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id)}
                          className="mx-auto flex justify-center items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
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
