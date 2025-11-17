import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Search,
  Info,
} from 'lucide-react';
import ResourceCard from './ResourceCard';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function ResourcesPage() {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const isFacultyOrAdmin =
    user?.role === 'faculty' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Simple local form state for add/edit
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    hours: '',
    contact: '',
    website: '',
    image: '',
    head_name: '',
    head_contact: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      location: '',
      hours: '',
      contact: '',
      website: '',
      image: '',
      head_name: '',
      head_contact: '',
    });
    setEditingOrg(null);
  };

  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'mine'


  const ORG_CATEGORIES = [
    { id: 'all', label: 'All Organizations' },
    { id: 'library', label: 'Library & Study Spaces' },
    { id: 'academic_support', label: 'Academic Support' },
    { id: 'career_services', label: 'Career Services' },
    { id: 'health_wellness', label: 'Health & Wellness' },
    { id: 'it_services', label: 'IT Services' },
    { id: 'activities', label: 'Activities' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');


  /* -----------------------------------------------------------
     LOAD organizations from backend
  ----------------------------------------------------------- */
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          'http://localhost:5000/api/organizations',
          {
            params: { user_id: user?.user_id },
          }
        );
        setOrganizations(res.data || []);
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
        toast.error('Could not load organizations.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  /* -----------------------------------------------------------
     FILTERED list based on search
  ----------------------------------------------------------- */
  const filteredOrganizations = useMemo(() => {
    let list = organizations;

    // 1) View filter: All vs My Organizations
    if (viewFilter === 'mine') {
      list = list.filter((org) => Boolean(org.is_member));
    }

    // 2) Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(
        (org) =>
          org.category &&
          org.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 3) Search filter
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((org) =>
      [org.title, org.description, org.location, org.contact, org.hours]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [organizations, viewFilter, selectedCategory, searchQuery]);



  /* -----------------------------------------------------------
     HANDLERS: join, add, edit, delete
  ----------------------------------------------------------- */

  const handleJoin = async (org) => {
    if (!user) return;

    try {
      await axios.post(
        `http://localhost:5000/api/organizations/${org.id}/join`,
        { user_id: user.user_id }
      );
      toast.success(`Joined ${org.title}`);

      // Update local state: mark as member, bump count
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === org.id
            ? {
                ...o,
                is_member: 1,
                member_count: (o.member_count || 0) + 1,
              }
            : o
        )
      );
    } catch (err) {
      console.error('Join org error:', err);
      toast.error('Failed to join organization');
    }
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (org) => {
    setEditingOrg(org);
    setForm({
      title: org.title || '',
      description: org.description || '',
      location: org.location || '',
      hours: org.hours || '',
      contact: org.contact || '',
      website: org.website || '',
      image: org.image || '',
      head_name: org.head_name || '',
      head_contact: org.head_contact || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      if (!form.title.trim()) {
        toast.error('Title is required');
        return;
      }

      if (editingOrg) {
        await axios.put(
          `http://localhost:5000/api/organizations/${editingOrg.id}`,
          {
            ...form,
            updated_by: user.user_id,
          }
        );
        toast.success('Organization updated');

        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingOrg.id
              ? { ...o, ...form }
              : o
          )
        );
      } else {
        const res = await axios.post(
          'http://localhost:5000/api/organizations',
          {
            ...form,
            created_by: user.user_id,
          }
        );
        toast.success('Organization created');

        setOrganizations((prev) => [
          ...prev,
          {
            id: res.data.org_id,
            member_count: 0,
            is_member: 0,
            ...form,
          },
        ]);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Save org error:', err);
      toast.error('Failed to save organization');
    }
  };

  const handleDelete = async (org) => {
    if (!user || !isAdmin) return;

    if (!window.confirm(`Remove ${org.title}?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/organizations/${org.id}`,
        {
          data: { user_id: user.user_id },
        }
      );
      toast.success('Organization removed');
      setOrganizations((prev) =>
        prev.filter((o) => o.id !== org.id)
      );
    } catch (err) {
      console.error('Delete org error:', err);
      toast.error('Failed to delete organization');
    }
  };

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Student Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover student organizations, support centers, and campus services you can join or connect with.
          </p>
        </div>

        {isFacultyOrAdmin && (
          <Button
            onClick={openNewDialog}
            size="sm"
            className="rounded-full px-4"
          >
            + Create Organization
          </Button>
        )}
      </div>

      {/* Search + info */}
      <div className="space-y-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5" />
          <p>
            Students can join organizations directly from this page. Faculty and admins can create new organizations,
            update organization heads, and manage listings.
          </p>
        </div>
      </div>

      {/* View filter: All vs My Organizations (like All / Registered on Events page) */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="button"
          size="sm"
          variant={viewFilter === 'all' ? 'default' : 'outline'}
          className="rounded-full px-4"
          onClick={() => setViewFilter('all')}
        >
          All Organizations
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewFilter === 'mine' ? 'default' : 'outline'}
          className="rounded-full px-4"
          onClick={() => setViewFilter('mine')}
        >
          My Organizations
        </Button>
      </div>

      {/* Category filter chips (same categories as Events page) */}
      <div className="flex flex-wrap gap-2 pt-2">
        {ORG_CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            size="sm"
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="rounded-full px-4"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Organizations list */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading organizations...
        </div>
      ) : filteredOrganizations.length > 0 ? (
        <div className="flex flex-col gap-6 pt-2">
          {filteredOrganizations.map((org) => (
            <ResourceCard
              key={org.id}
              resource={org}
              onJoin={handleJoin}
              onEdit={isFacultyOrAdmin ? openEditDialog : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
              isMember={Boolean(org.is_member)}
              isAdminView={isFacultyOrAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No organizations found for this filter.
          </p>
        </div>
      )}

      {/* Add / Edit dialog – scrollable card */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center">
          {/* Scrollable card */}
          <div className="w-full max-w-xl my-10 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg bg-background p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {editingOrg ? 'Edit Organization' : 'Add Organization'}
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., Engineering Student Council"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What does this organization do?"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="border border-input bg-background rounded-md px-3 py-2 text-sm w-full"
                  value={form.category || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option value="">Select a category...</option>
                  {ORG_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Building / Room (e.g., Nedderman Hall 105)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Meeting Time / Hours</label>
                <Input
                  value={form.hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hours: e.target.value }))
                  }
                  placeholder="e.g., Thursdays 6–7:30pm or Mon–Fri 9am–5pm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Contact (email / phone)</label>
                <Input
                  value={form.contact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact: e.target.value }))
                  }
                  placeholder="contact@org.edu | (555) 123-4567"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  placeholder="myorg.university.edu"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Image URL (optional)</label>
                <Input
                  value={form.image}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, image: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Organization Head Name</label>
                <Input
                  value={form.head_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      head_name: e.target.value,
                    }))
                  }
                  placeholder="Faculty / staff lead"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Organization Head Contact</label>
                <Input
                  value={form.head_contact}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      head_contact: e.target.value,
                    }))
                  }
                  placeholder="head@university.edu"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingOrg ? 'Save Changes' : 'Create Organization'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );


}
