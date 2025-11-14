// AdminPage.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw, Pencil, Eye, EyeOff } from "lucide-react";

/* -----------------------------------------------------
   Reusable Password Input
------------------------------------------------------ */
const PasswordInput = ({ placeholder, value, onChange, show, toggleShow }) => (
  <div className="relative w-full">
    <Input
      type={show ? "text" : "password"}
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

export default function AdminPage() {
  const API = "http://localhost:5000/api";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [showAddPassword, setShowAddPassword] = useState(false);

  /* -----------------------------------------------------
     Fetch Users
------------------------------------------------------ */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        showInactive ? `${API}/admin/users?all=true` : `${API}/admin/users`
      );
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showInactive]);

  /* -----------------------------------------------------
     Add User
------------------------------------------------------ */
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    user_uid: "",
    password: "",
  });

  const validateUID = (uid) => /^(stu|fac|adm)\d{4,5}$/.test(uid);

  const getRoleFromUid = (uid) =>
    uid.startsWith("stu") ? 1 : uid.startsWith("fac") ? 2 : 3;

  const computedEmail = useMemo(() => {
    return newUser.user_uid
      ? `${newUser.user_uid.toLowerCase()}@campus.edu`
      : "@campus.edu";
  }, [newUser.user_uid]);

  const handleAddUser = async () => {
    const { first_name, last_name, user_uid, password } = newUser;

    if (!first_name || !last_name || !user_uid)
      return toast.error("All fields are required.");

    const cleanUid = user_uid.trim().toLowerCase();

    if (!validateUID(cleanUid))
      return toast.error("UID must be stu/fac/adm + 4–5 digits.");

    const email = `${cleanUid}@campus.edu`;
    const role_id = getRoleFromUid(cleanUid);

    try {
      const res = await axios.post(`${API}/admin/create`, {
        first_name,
        last_name,
        email,
        user_uid: cleanUid,
        password,
        role_id,
      });

      toast.success(
        `User added successfully. Temporary password: ${res.data.user.dummy_password}`
      );

      setNewUser({ first_name: "", last_name: "", user_uid: "", password: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding user");
    }
  };

  /* -----------------------------------------------------
     Update User
------------------------------------------------------ */
  const handleUpdateUser = async () => {
    if (!editUser) return;

    try {
      await axios.patch(
        `${API}/admin/users/${editUser.user_id}/update`,
        editUser
      );
      toast.success("User updated");
      setEditOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating user");
    }
  };

  const handleStartEdit = (user) => {
    setEditUser(user);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditUser(null);
  };

  /* -----------------------------------------------------
     Soft Delete (Deactivate)
------------------------------------------------------ */
  const handleDeactivateUser = async (id) => {
    const current = JSON.parse(localStorage.getItem("user"));

    if (current?.user_id === id)
      return toast.error("You cannot deactivate your own account.");

    try {
      await axios.patch(`${API}/admin/users/${id}/deactivate`, {
        admin_user_id: current?.user_id,
      });

      toast.success("User deactivated");
      fetchUsers();
    } catch {
      toast.error("Failed to deactivate user");
    }
  };

  /* -----------------------------------------------------
     Activate User
------------------------------------------------------ */
  const handleActivateUser = async (id) => {
    try {
      await axios.patch(`${API}/admin/users/${id}/activate`);
      toast.success("User reactivated");
      fetchUsers();
    } catch {
      toast.error("Failed to activate user");
    }
  };

  /* -----------------------------------------------------
     Hard Delete
------------------------------------------------------ */
  const handleDeleteUser = async (id) => {
    const current = JSON.parse(localStorage.getItem("user"));

    if (current?.user_id === id)
      return toast.error("You cannot delete your own account.");

    if (!window.confirm("This will permanently delete user. Continue?")) return;

    try {
      await axios.delete(`${API}/admin/users/${id}`, {
        data: { admin_user_id: current?.user_id },
      });

      toast.success("User permanently deleted");
      if (editUser?.user_id === id) handleCloseEdit();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  /* -----------------------------------------------------
     UI Rendering
------------------------------------------------------ */
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInactive((p) => !p)}>
            {showInactive ? "Show Active Only" : "Show All Users"}
          </Button>
          <Button variant="secondary" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* USERS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {showInactive ? "All Users" : "Active Users"} ({users.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!loading && users.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No users found.
            </p>
          )}

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table className="w-full text-center text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>User UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{u.user_uid}</TableCell>
                      <TableCell>
                        {u.first_name} {u.last_name}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.role_id === 1
                          ? "Student"
                          : u.role_id === 2
                          ? "Faculty"
                          : "Admin"}
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

                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(u)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>

                        {u.is_active ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDeactivateUser(u.user_id)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleActivateUser(u.user_id)
                            }
                          >
                            Reactivate
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(u.user_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
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

      {/* EDIT USER PANEL */}
      {editUser && (
        <Card className="border-blue-500">
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Edit User</CardTitle>
            <Button variant="outline" size="sm" onClick={handleCloseEdit}>
              Close
            </Button>
          </CardHeader>

          {editOpen && (
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="First Name"
                value={editUser.first_name}
                onChange={(e) =>
                  setEditUser((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
              />

              <Input
                placeholder="Last Name"
                value={editUser.last_name}
                onChange={(e) =>
                  setEditUser((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
              />

              <Input disabled value={`${editUser.user_uid}@campus.edu`} />

              <Input
                placeholder="User UID"
                value={editUser.user_uid}
                onChange={(e) =>
                  setEditUser((prev) => ({
                    ...prev,
                    user_uid: e.target.value.toLowerCase(),
                  }))
                }
              />

              <Input
                disabled
                value={
                  editUser.user_uid.startsWith("stu")
                    ? "Student"
                    : editUser.user_uid.startsWith("fac")
                    ? "Faculty"
                    : "Admin"
                }
              />

              <Button
                className="col-span-3 bg-blue-600 text-black hover:bg-blue-700"
                variant="outline"
                onClick={handleUpdateUser}
              >
                Save Changes
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* ADD USER SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Add New User</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="First Name"
            value={newUser.first_name}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, first_name: e.target.value }))
            }
          />

          <Input
            placeholder="Last Name"
            value={newUser.last_name}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, last_name: e.target.value }))
            }
          />

          <Input value={computedEmail} disabled />

          <Input
            placeholder="User UID"
            value={newUser.user_uid}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, user_uid: e.target.value }))
            }
          />

          <PasswordInput
            placeholder="Password"
            value={newUser.password}
            onChange={(val) =>
              setNewUser((prev) => ({ ...prev, password: val }))
            }
            show={showAddPassword}
            toggleShow={() => setShowAddPassword((prev) => !prev)}
          />

          <Button className="col-span-4" onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
