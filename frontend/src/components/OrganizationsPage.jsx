import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Search, Plus } from "lucide-react";
import OrganizationsCard from "./OrganizationsCard";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import OrganizationModal from "./OrganizationModal";

export default function OrganizationsPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showMyOrgsOnly, setShowMyOrgsOnly] = useState(false);
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);

  // NEW: locations for dropdown
  const [locations, setLocations] = useState([]);

  const isGlobalAdmin =
    user?.role === "admin" || user?.role === 3 || user?.role === "3";

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
  const [editingOrg, setEditingOrg] = useState(null);

  /* ============================
     LOAD ORGANIZATIONS
  ============================ */
  const loadOrganizations = () => {
    if (!user) return;
    setLoading(true);

    api
      .get("/organizations", {
        params: { user_id: user.user_id },
      })
      .then((res) => setOrganizations(res.data))
      .catch(() => toast.error("Failed to load organizations"))
      .finally(() => setLoading(false));
  };

  /* ============================
     LOAD CATEGORIES
  ============================ */
  useEffect(() => {
    api
      .get("/org-categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  /* ============================
     LOAD GLOBAL ADMINS
  ============================ */
  useEffect(() => {
    api
      .get("/organizations/global-admins")
      .then((res) => setAdmins(res.data))
      .catch(() => {});
  }, []);

  /* ============================
     LOAD ORGS WHEN USER READY
  ============================ */
  useEffect(() => {
    if (user) loadOrganizations();
  }, [user]);

  /* ============================
     LOAD AVAILABLE LOCATIONS
     Trigger: whenever modal opens
  ============================ */
  useEffect(() => {
    if (!modalOpen) return;

    api
      .get("/locations/available")
      .then((res) => setLocations(res.data))
      .catch(() => toast.error("Failed to load locations"));
  }, [modalOpen]);

  /* ============================
     FILTERS
  ============================ */
  const filteredOrganizations = useMemo(() => {
    let list = organizations;
    const q = searchQuery.toLowerCase();

    if (q.trim()) {
      list = list.filter((o) =>
        [o.title, o.description, o.location_name, o.contact, o.hours]
          .filter(Boolean)
          .some((x) => x.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      list = list.filter((o) => o.category_id === selectedCategory);
    }

    if (showMyOrgsOnly) {
      list = list.filter((o) => o.is_member);
    }

    if (showManagedOnly) {
      list = list.filter((o) => o.is_org_admin === 1 || isGlobalAdmin);
    }

    return list;
  }, [
    organizations,
    searchQuery,
    selectedCategory,
    showMyOrgsOnly,
    showManagedOnly,
    isGlobalAdmin,
  ]);

  /* ============================
     HOURS HELPER
  ============================ */
  const parseHours = (hoursString) => {
    const clean = (hoursString || "").trim();
    if (!clean) return { b1: {}, b2: {} };

    const blocks = clean.split(";").map((b) => b.trim()).filter(Boolean);

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
      b1: parseBlock(blocks[0] ?? ""),
      b2: parseBlock(blocks[1] ?? ""),
    };
  };

  /* ============================
     EDIT FORM LOADER
  ============================ */
  const loadEditForm = (org) => {
    const { b1, b2 } = parseHours(org.hours);

    setEditingOrg(org);

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

    // ensure current location appears in dropdown
    api.get("/locations").then((res) => {
      const all = res.data;
      const current = all.find(
        (l) => l.location_id === org.location_id
      );
      if (current) {
        setLocations((prev) => {
          const exists = prev.some((l) => l.location_id === current.location_id);
          return exists ? prev : [...prev, current];
        });
      }
    });

    setModalOpen(true);
  };

  const openEdit = (org) => {
    const isOrgAdmin = org.is_org_admin === 1 || isGlobalAdmin;
    if (!isOrgAdmin)
      return toast.error("You do not have permission to edit this organization.");
    loadEditForm(org);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category_id) return toast.error("Please select category");
    if (!form.location_id) return toast.error("Please select a location");

    const blocks = [];

    if (
      form.hours_days_main &&
      form.hours_start_main &&
      form.hours_end_main
    ) {
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
        await api.put(
          `/organizations/${editingOrg.id}`,
          {
            title: form.title,
            description: form.description,
            location_id: form.location_id,
            hours: hoursFormatted,
            contact: form.contact,
            website: form.website,
            category_id: form.category_id,
            updated_by: user.user_id,
          }
        );

        if (form.new_admin_id) {
          await api.post(
            `/organizations/${editingOrg.id}/transfer-admin`,
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
        await api.post("/organizations", {
          title: form.title,
          description: form.description,
          location_id: form.location_id,
          hours: hoursFormatted,
          contact: form.contact,
          website: form.website,
          category_id: form.category_id,
          created_by: user.user_id,
        });

        loadOrganizations();
        toast.success("Organization created");
      }

      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    }
  };

  const handleJoin = async (org, isLeaving) => {
    try {
      if (isLeaving) {
        await api.post(
          `/organizations/${org.id}/leave`,
          { user_id: user.user_id }
        );
        toast.info("Left organization");
      } else {
        await api.post(
          `/organizations/${org.id}/join`,
          { user_id: user.user_id }
        );
        toast.success("Joined organization!");
      }

      await loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Membership update failed");
    }
  };

  const handleDelete = async (org) => {
    const isOrgAdmin = org.is_org_admin === 1 || isGlobalAdmin;

    if (!isOrgAdmin)
      return toast.error("You do not have permission to delete this organization.");

    try {
      await api.delete(`/organizations/${org.id}`, {
        data: { user_id: user.user_id },
      });

      toast.success("Organization deleted");
      loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete organization");
    }
  };


  const openCreateModal = () => {
    setEditingOrg(null);

    setForm({
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

    setModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Campus Organizations</h1>
          <p className="text-muted-foreground">
            Discover campus services and student life offices
          </p>
        </div>

        {isGlobalAdmin && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> Create Organization
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              !showMyOrgsOnly &&
              !showManagedOnly &&
              !selectedCategory
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => {
              setShowMyOrgsOnly(false);
              setShowManagedOnly(false);
              setSelectedCategory(null);
            }}
          >
            All Organizations
          </Button>

          <Button
            variant={showMyOrgsOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowMyOrgsOnly(true);
              setShowManagedOnly(false);
              setSelectedCategory(null);
            }}
          >
            My Organizations
          </Button>

          {isGlobalAdmin && (
            <Button
              variant={showManagedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowManagedOnly(true);
                setShowMyOrgsOnly(false);
                setSelectedCategory(null);
              }}
            >
              Managed
            </Button>
          )}

          {categories.map((cat) => (
            <Button
              key={cat.category_id}
              variant={
                selectedCategory === cat.category_id ? "default" : "outline"
              }
              size="sm"
              onClick={() =>
                setSelectedCategory((prev) =>
                  prev === cat.category_id ? null : cat.category_id
                )
              }
            >
              {cat.category_name}
            </Button>
          ))}
        </div>
      </div>

      {/* ORG GRID */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading organizations...
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No organizations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <OrganizationsCard
              key={org.id}
              resource={org}
              userRole={user.role}
              onJoin={handleJoin}
              onEdit={() => openEdit(org)}
              onDelete={() => handleDelete(org)}
              isMember={Boolean(org.is_member)}
              categories={categories}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <OrganizationModal
        open={modalOpen}
        setOpen={setModalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        categories={categories}
        admins={admins}
        locations={locations}
        isEdit={Boolean(editingOrg)}
      />
    </div>
  );
}
