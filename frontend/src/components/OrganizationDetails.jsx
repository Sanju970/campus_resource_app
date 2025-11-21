import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Clock, Mail, ArrowLeft, Pencil } from "lucide-react";
import OrganizationModal from "./OrganizationModal";
import { Input } from "./ui/input";

/* ------- role labels & badge colors ------- */

const ROLE_LABELS = {
  admin_delegate: "Admin Delegate",
  lead_faculty: "Lead Faculty",
  coordinator: "Coordinator",
  event_manager: "Event Manager",
  member: "Member",
};

const ROLE_BADGE_CLASSES = {
  admin_delegate: "bg-red-500/10 text-red-500",
  lead_faculty: "bg-purple-500/10 text-purple-500",
  coordinator: "bg-blue-500/10 text-blue-500",
  event_manager: "bg-teal-500/10 text-teal-500",
  member: "bg-gray-500/10 text-gray-500",
};

const ALL_ROLES = ["admin_delegate", "lead_faculty", "coordinator", "event_manager", "member"];

export default function OrganizationDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("member");

  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    hours_days_main: "",
    hours_start_main: "",
    hours_end_main: "",
    hours_days_secondary: "",
    hours_start_secondary: "",
    hours_end_secondary: "",
    contact: "",
    website: "",
    category_id: "",
    new_admin_id: "",
  });
  const [modalOpen, setModalOpen] = useState(false);

  const isGlobalAdmin =
    user?.role === "admin" || user?.role === 3 || user?.role === "3";
  const actingUserId = user?.user_id;

  /* ---------- load org basic info ---------- */

  useEffect(() => {
    if (!user) return;

    axios
      .get("http://localhost:5000/api/organizations", {
        params: { user_id: user.user_id },
      })
      .then((res) => {
        const found = res.data.find((o) => o.id === Number(orgId));
        setOrg(found || null);
      })
      .catch(() => {});
  }, [orgId, user]);

  /* ---------- load members ---------- */

  const loadMembers = () => {
    axios
      .get(`http://localhost:5000/api/organizations/${orgId}/members`)
      .then((res) => setMembers(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!orgId) return;
    loadMembers();
  }, [orgId]);

  /* ---------- load users for add-member dropdown ---------- */

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/all")
      .then((res) => setAllUsers(res.data || []))
      .catch(() => {});
  }, []);

  /* ---------- categories & global admins for edit-modal ---------- */

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/org-categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => {});

    axios
      .get("http://localhost:5000/api/organizations/global-admins")
      .then((res) => setAdmins(res.data || []))
      .catch(() => {});
  }, []);

  /* ---------- permissions ---------- */

  const actingMembership = useMemo(
    () => members.find((m) => m.user_id === actingUserId),
    [members, actingUserId]
  );

  const orgRole = actingMembership?.role || null;

  const isAdminDelegate = orgRole === "admin_delegate";
  const isLeadFaculty = orgRole === "lead_faculty";
  const isCoordinator = orgRole === "coordinator";
  const isEventManager = orgRole === "event_manager";

  const canManageOrg = isGlobalAdmin || isAdminDelegate || isLeadFaculty;
  const canDeleteOrg = isGlobalAdmin || isAdminDelegate;
  const canAddMembers = canManageOrg || isCoordinator || isEventManager;
  const canManageAllRoles = isGlobalAdmin || isAdminDelegate || isLeadFaculty;

  const getAllowedRoleOptions = (member) => {
    if (member.user_id === actingUserId) return []; // don't change own role from UI

    // powerful roles can change any
    if (canManageAllRoles) return ALL_ROLES;

    // limited: coordinator / event_manager
    if (isCoordinator || isEventManager) {
      if (
        member.role === "admin_delegate" ||
        member.role === "lead_faculty"
      ) {
        return [];
      }
      return ["member", "coordinator", "event_manager"];
    }

    return [];
  };

  const canRemoveMember = (member) => {
    if (member.user_id === actingUserId) return false;

    if (!canManageAllRoles && (member.role === "admin_delegate" || member.role === "lead_faculty")) {
      return false;
    }

    return canManageOrg;
  };

  /* ---------- edit modal helpers (org info) ---------- */

  const parseHours = (hoursString) => {
    const clean = (hoursString || "").trim();
    if (!clean) return { b1: {}, b2: {} };

    const blocks = clean
      .split(";")
      .map((b) => b.trim())
      .filter(Boolean);

    const parseBlock = (block) => {
      const [daysPart, timePart] = block.split(":");
      if (!daysPart || !timePart) return {};
      const [start, end] = timePart.split("–");
      return {
        days: daysPart.trim(),
        start: start?.trim(),
        end: end?.trim(),
      };
    };

    return {
      b1: parseBlock(blocks[0] || ""),
      b2: parseBlock(blocks[1] || ""),
    };
  };

  const openEditModal = () => {
    if (!org) return;

    if (!canManageOrg) {
      toast.error("You do not have permission to edit this organization.");
      return;
    }

    const { b1, b2 } = parseHours(org.hours);

    setForm({
      title: org.title || "",
      description: org.description || "",
      location: org.location || "",
      hours_days_main: b1.days || "",
      hours_start_main: b1.start || "",
      hours_end_main: b1.end || "",
      hours_days_secondary: b2.days || "",
      hours_start_secondary: b2.start || "",
      hours_end_secondary: b2.end || "",
      contact: org.contact || "",
      website: org.website || "",
      category_id: org.category_id || "",
      new_admin_id: "",
    });

    setModalOpen(true);
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category_id) return toast.error("Please select a category.");

    const blocks = [];
    if (form.hours_days_main && form.hours_start_main && form.hours_end_main) {
      blocks.push(
        `${form.hours_days_main}: ${form.hours_start_main} – ${form.hours_end_main}`
      );
    }
    if (
      form.hours_days_secondary &&
      form.hours_start_secondary &&
      form.hours_end_secondary
    ) {
      blocks.push(
        `${form.hours_days_secondary}: ${form.hours_start_secondary} – ${form.hours_end_secondary}`
      );
    }

    const hoursFormatted = blocks.join("; ");

    try {
      await axios.put(`http://localhost:5000/api/organizations/${org.id}`, {
        ...form,
        hours: hoursFormatted,
        updated_by: user.user_id,
      });

      if (form.new_admin_id) {
        await axios.post(
          `http://localhost:5000/api/organizations/${org.id}/transfer-admin`,
          {
            acting_user_id: user.user_id,
            new_admin_id: form.new_admin_id,
          }
        );
        toast.success("Admin rights transferred");
      }

      // refresh org info
      setOrg((prev) =>
        prev
          ? {
              ...prev,
              ...form,
              hours: hoursFormatted,
            }
          : prev
      );
      toast.success("Organization updated");
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  /* ---------- member operations ---------- */

  const handleAddMember = async () => {
    if (!addUserId) {
      return toast.error("Select a user first.");
    }

    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${orgId}/members/add`,
        {
          acting_user_id: actingUserId,
          new_user_id: addUserId,
          role: addRole || "member",
        }
      );

      toast.success("Member added");
      setAddUserId("");
      setAddRole("member");
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!canRemoveMember(member)) return;

    if (
      !window.confirm(
        `Remove ${member.first_name} ${member.last_name} from this organization?`
      )
    ) {
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${orgId}/members/remove`,
        {
          acting_user_id: actingUserId,
          remove_user_id: member.user_id,
        }
      );
      toast.success("Member removed");
      loadMembers();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleRoleChange = async (member, newRole) => {
    if (!newRole || newRole === member.role) return;

    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${orgId}/members/role`,
        {
          acting_user_id: actingUserId,
          target_user_id: member.user_id,
          new_role: newRole,
        }
      );
      toast.success("Role updated");
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  if (!org) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 px-0 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/organizations")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to organizations
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">
            {org.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {canDeleteOrg && (
            <span className="text-xs text-muted-foreground">
              You have admin access
            </span>
          )}
          {canManageOrg && (
            <Button
              variant="outline"
              size="sm"
              onClick={openEditModal}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* org details card */}
      <Card className="border border-border shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {org.description && (
            <p className="text-foreground whitespace-pre-line">
              {org.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {org.location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground block">
                    Location:
                  </span>
                  <span>{org.location}</span>
                </div>
              </div>
            )}

            {org.contact && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground block">
                    Contact:
                  </span>
                  <span>{org.contact}</span>
                </div>
              </div>
            )}

            {org.hours && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground block">
                    Hours:
                  </span>
                  <span>{org.hours}</span>
                </div>
              </div>
            )}

            {org.website && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 mt-0.5 text-primary">@</span>
                <div>
                  <span className="font-medium text-foreground block">
                    Website:
                  </span>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline text-sm break-all"
                  >
                    {org.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* members card */}
      <Card className="border border-border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Members ({members.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Manage roles and membership for this organization.
              </p>
            </div>

            {canAddMembers && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex items-center gap-2">
                  <select
                    className="border border-border rounded-md px-2 py-1 text-sm min-w-[10rem]"
                    value={addUserId}
                    onChange={(e) => setAddUserId(e.target.value)}
                  >
                    <option value="">Select user</option>
                    {allUsers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.first_name} {u.last_name} — {u.email}
                      </option>
                    ))}
                  </select>

                  <select
                    className="border border-border rounded-md px-2 py-1 text-sm"
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="event_manager">Event Manager</option>
                    {canManageAllRoles && (
                      <>
                        <option value="lead_faculty">Lead Faculty</option>
                        <option value="admin_delegate">Admin Delegate</option>
                      </>
                    )}
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={!addUserId}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="divide-y divide-border p-0">
          {members.length === 0 ? (
            <div className="py-6 px-4 text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            members.map((m) => {
              const allowedRoles = getAllowedRoleOptions(m);
              const canChangeRole = allowedRoles.length > 0;

              return (
                <div
                  key={m.user_id}
                  className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {m.first_name} {m.last_name}
                      </p>
                      <span
                        className={
                          "px-2 py-0.5 rounded-full text-xs font-medium " +
                          (ROLE_BADGE_CLASSES[m.role] ||
                            "bg-gray-500/10 text-gray-500")
                        }
                      >
                        {ROLE_LABELS[m.role] || "Member"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {canChangeRole && (
                      <select
                        className="border border-border rounded-md px-2 py-1 text-xs md:text-sm min-w-[9rem]"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value)}
                      >
                        {allowedRoles.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    )}

                    {canRemoveMember(m) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs md:text-sm"
                        onClick={() => handleRemoveMember(m)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* edit-organization modal */}
      <OrganizationModal
        open={modalOpen}
        setOpen={setModalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSaveOrg}
        categories={categories}
        admins={admins}
        isEdit={true}
      />
    </div>
  );
}
