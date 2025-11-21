import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import OrganizationsCard from "./OrganizationsCard";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import OrganizationModal from "./OrganizationModal";

const TIME_OPTIONS = [
  "6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
  "6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

export default function OrganizationsPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);

  const isGlobalAdmin =
    user?.role === "admin" || user?.role === 3 || user?.role === "3";

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
  const [editingOrg, setEditingOrg] = useState(null);

  const loadOrganizations = () => {
    if (!user) return;
    setLoading(true);

    axios
      .get("http://localhost:5000/api/organizations", {
        params: { user_id: user.user_id },
      })
      .then((res) => setOrganizations(res.data))
      .catch(() => toast.error("Failed to load organizations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/org-categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/organizations/global-admins")
      .then((res) => setAdmins(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredOrganizations = useMemo(() => {
    let list = organizations;

    const q = searchQuery.toLowerCase();
    if (q.trim()) {
      list = list.filter((o) =>
        [o.title, o.description, o.location, o.contact, o.hours]
          .filter(Boolean)
          .some((x) => x.toLowerCase().includes(q))
      );
    }
    return list;
  }, [organizations, searchQuery]);

  // ---- hours helpers ----
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

  const loadEditForm = (org) => {
    const { b1, b2 } = parseHours(org.hours);

    setEditingOrg(org);
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

  const openEdit = (org) => {
    const isOrgAdmin = org.is_org_admin === 1 || isGlobalAdmin;

    if (!isOrgAdmin) {
      toast.error("You do not have permission to edit this organization.");
      return;
    }

    loadEditForm(org);
  };

  const handleSave = async () => {
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
      if (editingOrg) {
        await axios.put(
          `http://localhost:5000/api/organizations/${editingOrg.id}`,
          {
            ...form,
            hours: hoursFormatted,
            updated_by: user.user_id,
          }
        );

        if (form.new_admin_id) {
          await axios.post(
            `http://localhost:5000/api/organizations/${editingOrg.id}/transfer-admin`,
            {
              acting_user_id: user.user_id,
              new_admin_id: form.new_admin_id,
            }
          );
          toast.success("Admin rights transferred");
        }

        loadOrganizations();
        toast.success("Organization updated");
      } else {
        await axios.post("http://localhost:5000/api/organizations", {
          ...form,
          hours: hoursFormatted,
          created_by: user.user_id,
        });

        loadOrganizations();
        toast.success("Organization created");
      }

      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save organization");
    }
  };

  const handleDelete = async (org) => {
    const isOrgAdmin = org.is_org_admin === 1 || isGlobalAdmin;

    if (!isOrgAdmin) {
      toast.error("You do not have permission to delete this organization.");
      return;
    }

    if (!window.confirm(`Delete "${org.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/organizations/${org.id}`, {
        data: { user_id: user.user_id },
      });
      setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
      toast.success("Organization deleted");
    } catch {
      toast.error("Failed to delete organization");
    }
  };

  // when creating, reset form
  const openCreateModal = () => {
    setEditingOrg(null);
    setForm({
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
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Campus Organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover campus services, support centers, and student life offices.
          </p>
        </div>

        {isGlobalAdmin && (
          <Button
            className="rounded-full px-4"
            onClick={openCreateModal}
          >
            + Create
          </Button>
        )}
      </div>

      {/* search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations by name, location, or contact..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading organizations...
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No organizations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <OrganizationsCard
              key={org.id}
              resource={org}
              userRole={user.role}
              onJoin={(o, leave) => {
                // membership join/leave can be wired later
                // keep placeholder so UI stays consistent
              }}
              onEdit={() => openEdit(org)}
              onDelete={() => handleDelete(org)}
              isMember={Boolean(org.is_member)}
            />
          ))}
        </div>
      )}

      {/* modal */}
      <OrganizationModal
        open={modalOpen}
        setOpen={setModalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        categories={categories}
        admins={admins}
        isEdit={Boolean(editingOrg)}
      />
    </div>
  );
}
