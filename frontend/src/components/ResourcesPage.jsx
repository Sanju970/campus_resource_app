import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";
import ResourceCard from "./ResourceCard";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import OrganizationModal from "./OrganizationModal";

const TIME_OPTIONS = [
  "6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
  "6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

export default function ResourcesPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isGlobalAdmin = user?.role === "admin";

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
    head_user_id: "",
    category_id: "",
    current_org_role: "",
    new_admin_id: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  /* ---------------------- LOAD DATA ---------------------- */

  useEffect(() => {
    axios.get("http://localhost:5000/api/faculty")
      .then((res) => setFaculty(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/organizations/global-admins")
      .then((res) => setAdmins(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/org-categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    axios.get("http://localhost:5000/api/organizations", {
      params: { user_id: user.user_id },
    })
    .then((res) => setOrganizations(res.data))
    .catch(() => toast.error("Failed to load organizations"))
    .finally(() => setLoading(false));
  }, [user]);

  /* ---------------------- FILTER ORGANIZATIONS ---------------------- */

  const filteredOrganizations = useMemo(() => {
    let list = organizations;

    if (selectedCategory === "mine") {
      list = list.filter((o) => o.is_member === 1);
    } else if (selectedCategory !== "all") {
      list = list.filter((o) => o.category_key === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        [o.title, o.description, o.location, o.contact, o.hours]
          .filter(Boolean)
          .some((x) => x.toLowerCase().includes(q))
      );
    }
    return list;
  }, [organizations, searchQuery, selectedCategory]);

  /* ---------------------- JOIN / LEAVE ---------------------- */

  const handleJoin = async (org, leave = false) => {
    try {
      if (!leave) {
        await axios.post(
          `http://localhost:5000/api/organizations/${org.id}/join`,
          { user_id: user.user_id }
        );

        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === org.id
              ? { ...o, is_member: 1, member_count: o.member_count + 1 }
              : o
          )
        );

        toast.success(`Joined ${org.title}`);
      } else {
        const res = await axios.post(
          `http://localhost:5000/api/organizations/${org.id}/leave`,
          { user_id: user.user_id }
        );

        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === org.id
              ? { ...o, is_member: 0, member_count: o.member_count - 1 }
              : o
          )
        );

        toast.success(res.data.message || `Left ${org.title}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  /* ---------------------- PARSE HOURS ---------------------- */

  const parseHours = (hoursString) => {
    const clean = (hoursString || "").trim();
    if (!clean) return { b1: {}, b2: {} };

    const blocks = clean.split(";").map(b => b.trim()).filter(Boolean);

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

  /* ---------------------- ORG ADMIN CHECK ---------------------- */

  const isOrgAdmin = (org) => {
    return Boolean(org.is_org_admin);
    // You can also extend: return org.org_role === "admin"
  };

  /* ---------------------- OPEN EDIT MODAL ---------------------- */

  const openEdit = async (org) => {
    if (!isOrgAdmin(org)) {
      toast.error("Only this organization's admin can edit.");
      return;
    }

    try {
      const roleRes = await axios.get(
        `http://localhost:5000/api/organizations/${org.id}/members`
      );

      const me = roleRes.data.find(m => m.user_id === user.user_id);

      if (me?.org_role !== "admin") {
        toast.error("Only the organization admin can edit.");
        return;
      }

      const { b1, b2 } = parseHours(org.hours);

      setEditingOrg(org);
      setForm({
        title: org.title,
        description: org.description,
        location: org.location,
        hours_days_main: b1.days || "",
        hours_start_main: b1.start || "",
        hours_end_main: b1.end || "",
        hours_days_secondary: b2.days || "",
        hours_start_secondary: b2.start || "",
        hours_end_secondary: b2.end || "",
        contact: org.contact,
        website: org.website,
        head_user_id: org.head_user_id,
        category_id: org.category_id,
        current_org_role: me?.org_role || "",
        new_admin_id: "",
      });

      setModalOpen(true);
    } catch (err) {
      toast.error("Failed to load organization data.");
    }
  };

  /* ---------------------- VALIDATE TIME ---------------------- */

  const getTimeIndex = (label) => TIME_OPTIONS.indexOf(label);

  /* ---------------------- SAVE ORG ---------------------- */

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");

    const hasMainAll =
      form.hours_days_main &&
      form.hours_start_main &&
      form.hours_end_main;

    const hasSecAny =
      form.hours_days_secondary ||
      form.hours_start_secondary ||
      form.hours_end_secondary;

    const hasSecAll =
      form.hours_days_secondary &&
      form.hours_start_secondary &&
      form.hours_end_secondary;

    if (hasSecAny && !hasSecAll)
      return toast.error("Complete secondary hours or clear them.");

    if (hasMainAll) {
      const si = getTimeIndex(form.hours_start_main);
      const ei = getTimeIndex(form.hours_end_main);
      if (si >= ei) return toast.error("Primary start must be before end.");
    }

    if (hasSecAll) {
      const si = getTimeIndex(form.hours_start_secondary);
      const ei = getTimeIndex(form.hours_end_secondary);
      if (si >= ei) return toast.error("Secondary start must be before end.");
    }

    const blocks = [];
    if (hasMainAll)
      blocks.push(
        `${form.hours_days_main}: ${form.hours_start_main} – ${form.hours_end_main}`
      );
    if (hasSecAll)
      blocks.push(
        `${form.hours_days_secondary}: ${form.hours_start_secondary} – ${form.hours_end_secondary}`
      );

    const hoursFormatted = blocks.join("; ");

    try {
      if (editingOrg) {
        if (!isOrgAdmin(editingOrg)) {
          toast.error("You are not allowed to edit this organization.");
          return;
        }

        await axios.put(
          `http://localhost:5000/api/organizations/${editingOrg.id}`,
          { ...form, hours: hoursFormatted, updated_by: user.user_id }
        );

        if (form.new_admin_id) {
          await axios.post(
            `http://localhost:5000/api/organizations/${editingOrg.id}/transfer-admin`,
            {
              acting_user_id: user.user_id,
              new_admin_id: form.new_admin_id,
            }
          );
          toast.success("Admin rights transferred!");
        }

        const refreshed = await axios.get(
          "http://localhost:5000/api/organizations",
          { params: { user_id: user.user_id } }
        );

        setOrganizations(refreshed.data);
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/organizations",
          { ...form, hours: hoursFormatted, created_by: user.user_id }
        );

        setOrganizations((prev) => [
          ...prev,
          {
            id: res.data.org_id,
            member_count: 0,
            is_member: 0,
            ...form,
            hours: hoursFormatted,
          },
        ]);

        toast.success("Created successfully");
      }

      setModalOpen(false);
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  /* ---------------------- DELETE ORG ---------------------- */

  const handleDelete = async (org) => {
    if (!isOrgAdmin(org)) {
      toast.error("Only the organization admin can delete.");
      return;
    }

    if (!window.confirm(`Delete ${org.title}?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/organizations/${org.id}`,
        { data: { user_id: user.user_id } }
      );

      setOrganizations((prev) => prev.filter((o) => o.id !== org.id));

      toast.success("Removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ---------------------- UI ---------------------- */

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Discover organizations, support centers & campus services.
          </p>
        </div>

        {isGlobalAdmin && (
          <Button
            className="rounded-full px-4"
            onClick={() => {
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
                head_user_id: "",
                category_id: "",
                current_org_role: "",
                new_admin_id: "",
              });
              setModalOpen(true);
            }}
          >
            + Create
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Button>

        <Button
          size="sm"
          variant={selectedCategory === "mine" ? "default" : "outline"}
          onClick={() => setSelectedCategory("mine")}
        >
          My Organizations
        </Button>

        {categories.map((c) => (
          <Button
            key={c.category_key}
            size="sm"
            variant={selectedCategory === c.category_key ? "default" : "outline"}
            onClick={() => setSelectedCategory(c.category_key)}
          >
            {c.category_name}
          </Button>
        ))}
      </div>

      {/* ORGANIZATIONS LIST */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <ResourceCard
              key={org.id}
              resource={org}
              onJoin={handleJoin}
              onEdit={isOrgAdmin(org) ? () => openEdit(org) : undefined}
              onDelete={isOrgAdmin(org) ? () => handleDelete(org) : undefined}
              isMember={Boolean(org.is_member)}
            />
          ))}

        </div>
      )}

      {/* MODAL */}
      <OrganizationModal
        open={modalOpen}
        setOpen={setModalOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        categories={categories}
        faculty={faculty}
        admins={admins}
        isEdit={Boolean(editingOrg)}
      />
    </div>
  );
}
