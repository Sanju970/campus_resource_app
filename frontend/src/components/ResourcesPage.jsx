import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Info } from "lucide-react";
import ResourceCard from "./ResourceCard";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import OrganizationModal from "./OrganizationModal";

export default function ResourcesPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    hours: "",
    contact: "",
    website: "",
    head_user_id: "",
    category: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  // LOAD FACULTY
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/faculty")
      .then((res) => setFaculty(res.data))
      .catch(() => {});
  }, []);

  // LOAD CATEGORIES
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/org-categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  // LOAD ORGANIZATIONS
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    axios
      .get("http://localhost:5000/api/organizations", {
        params: { user_id: user.user_id },
      })
      .then((res) => setOrganizations(res.data))
      .catch(() => toast.error("Failed to load organizations"))
      .finally(() => setLoading(false));
  }, [user]);

  // FILTER
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

  // JOIN & LEAVE
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
        await axios.post(
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

        toast.success(`Left ${org.title}`);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  // EDIT
  const openEdit = (org) => {
    setEditingOrg(org);
    setForm({
      title: org.title,
      description: org.description,
      location: org.location,
      hours: org.hours,
      contact: org.contact,
      website: org.website,
      head_user_id: org.head_user_id,
      category: org.category,
    });
    setModalOpen(true);
  };

  // SAVE
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");

    try {
      if (editingOrg) {
        await axios.put(
          `http://localhost:5000/api/organizations/${editingOrg.id}`,
          { ...form, updated_by: user.user_id }
        );

        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingOrg.id ? { ...o, ...form } : o
          )
        );

        toast.success("Updated successfully");
      } else {
        const res = await axios.post(
          "http://localhost:5000/api/organizations",
          { ...form, created_by: user.user_id }
        );

        setOrganizations((prev) => [
          ...prev,
          { id: res.data.org_id, member_count: 0, is_member: 0, ...form },
        ]);

        toast.success("Created successfully");
      }

      setModalOpen(false);
    } catch {
      toast.error("Save failed");
    }
  };

  // DELETE
  const handleDelete = async (org) => {
    if (!window.confirm(`Delete ${org.title}?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/organizations/${org.id}`,
        { data: { user_id: user.user_id } }
      );

      setOrganizations((prev) =>
        prev.filter((o) => o.id !== org.id)
      );

      toast.success("Removed");
    } catch {
      toast.error("Delete failed");
    }
  };

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

        {isAdmin && (
          <Button
            className="rounded-full px-4"
            onClick={() => {
              setEditingOrg(null);
              setForm({
                title: "",
                description: "",
                location: "",
                hours: "",
                contact: "",
                website: "",
                head_user_id: "",
                category: "",
              });
              setModalOpen(true);
            }}
          >
            + Create
          </Button>
        )}
      </div>

      {/* SEARCH */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="flex flex-wrap gap-2">
        {/* ALL */}
        <Button
          size="sm"
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Button>

        {/* MY ORGANIZATIONS */}
        <Button
          size="sm"
          variant={selectedCategory === "mine" ? "default" : "outline"}
          onClick={() => setSelectedCategory("mine")}
        >
          My Organizations
        </Button>

        {/* CATEGORY FILTERS */}
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


      {/* LIST */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <ResourceCard
              key={org.id}
              resource={org}
              onJoin={handleJoin}
              onEdit={isAdmin ? openEdit : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
              isMember={Boolean(org.is_member)}
              isAdminView={isAdmin}
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
        isEdit={Boolean(editingOrg)}
      />
    </div>
  );
}
