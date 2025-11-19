import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

/* ============================================================
   Role Badge UI Component
============================================================ */
function getRoleBadge(role, isActive) {
  if (!isActive) {
    return (
      <span className="px-2 py-0.5 rounded-md text-xs bg-gray-500 text-white">
        Inactive
      </span>
    );
  }

  const styles = {
    head: "bg-purple-500",
    admin: "bg-red-500",
    advisor: "bg-blue-500",
    member: "bg-green-500",
  };

  const label = {
    head: "Head",
    admin: "Admin",
    advisor: "Advisor",
    member: "Member",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs text-white ${
        styles[role] || "bg-gray-500"
      }`}
    >
      {label[role] || "Member"}
    </span>
  );
}

export default function OrganizationMembers() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [orgName, setOrgName] = useState("");

  // Add member modal state
  const [addModal, setAddModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const actingUserId = user?.user_id;

  /* ============================================================
     Load organization name
  ============================================================ */
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/organizations`)
      .then((res) => {
        const found = res.data.find((o) => o.id === Number(orgId));
        if (found) setOrgName(found.title);
      })
      .catch(() => {});
  }, [orgId]);

  /* ============================================================
     Load members
  ============================================================ */
  const loadMembers = () => {
    axios
      .get(`http://localhost:5000/api/organizations/${orgId}/members`)
      .then((res) => setMembers(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadMembers();
  }, [orgId]);

  /* ============================================================
     Load ALL active users for dropdown
     (Your backend route: GET /api/all)
  ============================================================ */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/all")
      .then((res) => setAllUsers(res.data))
      .catch(() => {});
  }, []);

  /* ============================================================
     Determine if acting user is Head/Admin
  ============================================================ */
  const isManager = members.some(
    (m) =>
      m.user_id === actingUserId &&
      (m.org_role === "head" || m.org_role === "admin")
  );

  /* ============================================================
     Add Member
  ============================================================ */
  const handleAddMember = async () => {
    if (!selectedUser) return toast.error("Select a user first.");

    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${orgId}/members/add`,
        {
          acting_user_id: actingUserId,
          new_user_id: selectedUser.user_id,
        }
      );

      toast.success("Member added!");
      setAddModal(false);
      setSelectedUser(null);
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  /* ============================================================
     Remove Member
  ============================================================ */
  const handleRemove = async (remove_user_id, role) => {
      if (role === "head") {
        return toast.error("Cannot remove the head of organization");
      }

      if (role === "admin" && m.user_id === actingUserId) {
        return toast.error("You must transfer admin before leaving");
      }

      if (role === "admin") {
        return toast.error("Cannot remove another admin");
      }


    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${orgId}/members/remove`,
        {
          acting_user_id: actingUserId,
          remove_user_id,
        }
      );

      toast.success("Member removed");
      loadMembers();
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* TITLE */}
      <h1 className="text-2xl font-bold">
        {orgName ? `${orgName} — Members` : "Members"}
      </h1>

      {/* ADD MEMBER BUTTON */}
      {isManager && (
        <Button className="mb-4" onClick={() => setAddModal(true)}>
          + Add Member
        </Button>
      )}

      {/* ADD MEMBER MODAL */}
      {addModal && (
        <div className="border p-4 rounded shadow bg-white space-y-4">
          <h2 className="text-lg font-semibold">Add Member</h2>

          {/* SIMPLE SELECT DROPDOWN */}
          <select
            className="border rounded-md w-full p-2"
            value={selectedUser?.user_id || ""}
            onChange={(e) => {
              const found = allUsers.find(
                (u) => u.user_id === Number(e.target.value)
              );
              setSelectedUser(found || null);
            }}
          >
            <option value="">Select User</option>

            {allUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name} — {u.email}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleAddMember}
              disabled={!selectedUser}
            >
              Add
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setAddModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* MEMBERS LIST */}
      {members.map((m) => (
        <Card
          key={m.user_id}
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => navigate(`/user/${m.user_id}`)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">
                  {m.first_name} {m.last_name}
                </p>

                {getRoleBadge(m.org_role, m.is_active)}
              </div>

              <p className="text-sm text-gray-600">{m.email}</p>
            </div>

            {/* REMOVE BUTTON — Only for managers */}
            {isManager && m.user_id !== actingUserId && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(m.user_id, m.org_role);
                }}
              >
                Remove
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
