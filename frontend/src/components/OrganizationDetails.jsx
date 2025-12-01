// ======================= OrganizationDetails.jsx =========================
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  Pencil,
  Globe,
} from "lucide-react";
import OrganizationModal from "./OrganizationModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

/* ------- role labels & badge colors ------- */

const ROLE_LABELS = {
  admin_delegate: "Admin Delegate",
  lead_faculty: "Lead Faculty",
  coordinator: "Coordinator",
  event_manager: "Event Manager",
  member: "Member",
};

const ROLE_BADGE_CLASSES = {
  admin_delegate: "bg-red-500 text-white",
  lead_faculty: "bg-purple-500 text-white",
  coordinator: "bg-blue-500 text-white",
  event_manager: "bg-teal-500 text-white",
  member: "bg-gray-500 text-white",
};

const ALL_ROLES = [
  "admin_delegate",
  "lead_faculty",
  "coordinator",
  "event_manager",
  "member",
];

/**
 * Convert "5 PM" / "9:30 AM" to minutes since midnight.
 * Assumes 12-hour format with a space before AM/PM.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;

  const parts = timeStr.trim().split(" ");
  if (parts.length !== 2) return null;

  const [timePart, ampmRaw] = parts;
  const ampm = ampmRaw.toUpperCase();

  let [hStr, mStr] = timePart.split(":");
  let hours = Number(hStr);
  let minutes = mStr ? Number(mStr) : 0;

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export default function OrganizationDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("");

  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [locations, setLocations] = useState([]);
  // Dialog state for member removal
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Dialog state for organization delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  const [form, setForm] = useState({
    title: "",
    description: "",
    location_id: "",
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

  /* ---------- load org info ---------- */

  useEffect(() => {
    if (!user) return;

    api
      .get("/organizations", {
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
    api
      .get(`/organizations/${orgId}/members`)
      .then((res) => setMembers(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!orgId) return;
    loadMembers();
  }, [orgId]);

  /* ---------- load all users ---------- */

  useEffect(() => {
    api
      .get("/all")
      .then((res) => setAllUsers(res.data || []))
      .catch(() => {});
  }, []);

  /* ---------- categories + admins ---------- */

  useEffect(() => {
    api
      .get("/org-categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => {});

    api
      .get("/organizations/global-admins")
      .then((res) => setAdmins(res.data || []))
      .catch(() => {});
  }, []);

  /* ---------- load locations ---------- */

  const loadLocations = async (currentLocationId) => {
    try {
      const available = await api.get(
        "/locations/available"
      );

      let list = available.data;

      if (currentLocationId) {
        const all = await api.get("/locations");
        const found = all.data.find(
          (l) => l.location_id === currentLocationId
        );

        if (found && !list.some((l) => l.location_id === found.location_id)) {
          list.push(found);
        }
      }

      setLocations(list);
    } catch (err) {
      toast.error("Failed to load locations");
    }
  };

  /* ---------- permission helpers ---------- */

  const actingMembership = useMemo(
    () => members.find((m) => m.user_id === actingUserId),
    [members, actingUserId]
  );

  const orgRole = actingMembership?.org_role || null;

  const isAdminDelegate = orgRole === "admin_delegate";
  const isLeadFaculty = orgRole === "lead_faculty";
  const isCoordinator = orgRole === "coordinator";
  const isEventManager = orgRole === "event_manager";

  const canManageOrg = isGlobalAdmin || isAdminDelegate || isLeadFaculty;
  const canDeleteOrg = isGlobalAdmin || isAdminDelegate;
  const canAddMembers = canManageOrg || isCoordinator || isEventManager;
  const canManageAllRoles = isGlobalAdmin || isAdminDelegate || isLeadFaculty;

  /* ---------- allowed roles ---------- */

  const getAllowedRoleOptions = (member) => {
    if (member.user_id === actingUserId) return [];

    const current = member.org_role;

    if (canManageAllRoles) return ALL_ROLES;

    if (isCoordinator || isEventManager) {
      if (current === "admin_delegate" || current === "lead_faculty") {
        return [];
      }
      return ["member", "coordinator", "event_manager"];
    }

    return [];
  };

  const canRemoveMember = (member) => {
    if (member.user_id === actingUserId) return false;

    const current = member.org_role;

    if (
      !canManageAllRoles &&
      (current === "admin_delegate" || current === "lead_faculty")
    ) {
      return false;
    }

    return canManageOrg;
  };

  const parseHours = (hoursString) => {
    const clean = (hoursString || "").trim();
    if (!clean) return { b1: {}, b2: {} };

    // Normalize backend formats:
    // Standardize all possible separators to a consistent frontend format.
    let normalized = clean
      // convert pipe | into semicolon ;
      .replace(/\|/g, ";")
      // convert hyphen ranges (with any spacing) into the EN DASH format
      .replace(/\s*-\s*/g, " – ")
      // remove double spaces
      .replace(/\s\s+/g, " ");

    // Now split blocks
    const blocks = normalized
      .split(";")
      .map((b) => b.trim())
      .filter(Boolean);

    const parseBlock = (block) => {
      const [daysPart, timePart] = block.split(":");
      if (!daysPart || !timePart) return {};

      let [start, end] = timePart.split("–").map((x) => x?.trim());

      return {
        days: daysPart.trim(),
        start,
        end,
      };
    };

    return {
      b1: parseBlock(blocks[0] || ""),
      b2: parseBlock(blocks[1] || ""),
    };
  };


  const openEditModal = async () => {
    if (!org) return;

    if (!canManageOrg) {
      toast.error("You do not have permission to edit this organization.");
      return;
    }

    const { b1, b2 } = parseHours(org.hours);

    setForm({
      title: org.title || "",
      description: org.description || "",
      location_id: org.location_id || "",
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

    await loadLocations(org.location_id);

    setModalOpen(true);
  };

  const handleSaveOrg = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category_id) return toast.error("Select a category");
    if (!form.location_id) return toast.error("Select a location");

    // ---- Time validation (US Central Time) ----
    if (form.hours_days_main && form.hours_start_main && form.hours_end_main) {
      const startMain = parseTimeToMinutes(form.hours_start_main);
      const endMain = parseTimeToMinutes(form.hours_end_main);

      if (startMain != null && endMain != null && endMain <= startMain) {
        return toast.error(
          "Primary hours: End time must be after start time (US Central Time)."
        );
      }
    }

    if (
      form.hours_days_secondary &&
      form.hours_start_secondary &&
      form.hours_end_secondary
    ) {
      const startSec = parseTimeToMinutes(form.hours_start_secondary);
      const endSec = parseTimeToMinutes(form.hours_end_secondary);

      if (startSec != null && endSec != null && endSec <= startSec) {
        return toast.error(
          "Secondary hours: End time must be after start time (US Central Time)."
        );
      }
    }

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
      await api.put(`/organizations/${org.id}`, {
        title: form.title,
        description: form.description,
        location_id: form.location_id,
        category_id: form.category_id,
        contact: form.contact,
        website: form.website,

        // backend expects raw hour fields, not "hours"
        hours_days_main: form.hours_days_main,
        hours_start_main: form.hours_start_main,
        hours_end_main: form.hours_end_main,

        hours_days_secondary: form.hours_days_secondary,
        hours_start_secondary: form.hours_start_secondary,
        hours_end_secondary: form.hours_end_secondary,

        updated_by: user.user_id,
      });

      if (form.new_admin_id) {
        await api.post(
          `/organizations/${org.id}/transfer-admin`,
          {
            acting_user_id: user.user_id,
            new_admin_id: form.new_admin_id,
          }
        );
        toast.success("Admin rights transferred");
      }

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

  /* ---------- member actions ---------- */

  const handleAddMember = async () => {
    if (!addUserId) return toast.error("Select a user");

    try {
      await api.post(
        `/organizations/${orgId}/members/add`,
        { acting_user_id: actingUserId, new_user_id: addUserId }
      );
      toast.success("Member added");
      setAddUserId("");
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMemberClick = (member) => {
    if (!canRemoveMember(member)) return;
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

const confirmRemoveMember = async () => {
  if (!memberToRemove) return;

  try {
    await api.post(`/organizations/${orgId}/members/remove`, {
      acting_user_id: actingUserId,
      remove_user_id: memberToRemove.user_id,
    });

    toast.success("Member removed");
    loadMembers();
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to remove member");
  }

  setMemberToRemove(null);
  setRemoveDialogOpen(false);
};


  const handleRoleChange = async (member, newRole) => {
    if (!newRole || newRole === member.org_role) return;

    try {
      await api.put(
        `/organizations/${orgId}/members/${member.user_id}/role`,
        {
          acting_user_id: actingUserId,
          new_role: newRole,
        }
      );
      toast.success("Role updated");
      loadMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
      loadMembers();
    }
  };

  /* ---------- loading state ---------- */

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

  /* ============================================================
     RENDER PAGE
  ============================================================ */

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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

      {/* Overview Card */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold">Overview</h2>

        {org.description && (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {org.description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Location (new campus_locations + legacy) */}
          {(org.location_name || org.legacy_location) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Location</p>
                <p className="text-sm text-muted-foreground">
                  {org.location_name
                    ? `${org.location_name}${
                        org.building ? ` — ${org.building}` : ""
                      }${org.room ? ` — Room ${org.room}` : ""}`
                    : org.legacy_location}
                </p>
              </div>
            </div>
          )}

          {/* Hours */}
          {org.hours && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">
                  Hours{" "}
                  <span className="font-normal text-xs">
                    (US Central Time)
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{org.hours}</p>
              </div>
            </div>
          )}

          {/* Contact */}
          {org.contact && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {org.contact}
                </p>
              </div>
            </div>
          )}

          {/* Website */}
          {org.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Website</p>
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {org.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members */}
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
              <div className="flex items-center gap-2">
                <select
                  className="border border-border rounded-md px-2 py-1 text-sm min-w-[12rem]"
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

                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={!addUserId}
                  className="bg-blue-500 hover:bg-blue-500 text-white"
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
                  className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/users/${m.user_id}`}
                        className="font-medium text-base text-blue-600 hover:underline"
                      >
                        {m.first_name} {m.last_name}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_BADGE_CLASSES[m.org_role] ||
                          "bg-gray-600 text-white"
                        }`}
                      >
                        {ROLE_LABELS[m.org_role]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex justify-end items-center gap-3">
                    {canChangeRole && (
                      <select
                        className="border border-border rounded-md px-2 py-1 text-xs md:text-sm min-w-[9rem]"
                        value={m.org_role}
                        onChange={(e) =>
                          handleRoleChange(m, e.target.value)
                        }
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
                        onClick={() => handleRemoveMemberClick(m)}
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

      {/* Edit Modal */}
      <OrganizationModal
        open={modalOpen}
        setOpen={setModalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSaveOrg}
        categories={categories}
        admins={admins}
        locations={locations}
        isEdit={true}
        canTransferAdmin={isGlobalAdmin || isAdminDelegate}
      />
      {/* ================= REMOVE MEMBER DIALOG ================= */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              {memberToRemove
                ? `Are you sure you want to remove ${memberToRemove.first_name} ${memberToRemove.last_name} from this organization?`
                : "Are you sure you want to remove this member?"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false);
                setMemberToRemove(null);
              }}
            >
              Cancel
            </Button>

            <Button variant="destructive" onClick={confirmRemoveMember}>
              Yes, remove member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE ORG DIALOG ================= */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The organization will be permanently
              removed and members will lose access.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await api.delete(`/organizations/${org.id}`, {
                    data: { user_id: actingUserId },
                  });
                  toast.success("Organization deleted");
                  navigate("/organizations");
                } catch (err) {
                  toast.error(
                    err.response?.data?.message || "Failed to delete organization"
                  );
                }
                setDeleteDialogOpen(false);
              }}
            >
              Yes, delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
