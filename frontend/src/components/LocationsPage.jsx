import { useEffect, useState } from "react";
import api from "../api/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Trash2, Building2, MapPin, Pencil } from "lucide-react";

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);

  const [editing, setEditing] = useState(null); // <-- NEW
  const [form, setForm] = useState({
    location_name: "",
    building: "",
    room: "",
  });

  const isGlobalAdmin =
    user?.role === "admin" || user?.role === 3 || user?.role === "3";

  const loadLocations = () => {
    api
      .get("/locations")
      .then((res) => setLocations(res.data))
      .catch(() => toast.error("Failed to load locations"));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const resetForm = () => {
    setForm({ location_name: "", building: "", room: "" });
    setEditing(null);
  };

  const handleAddOrEdit = async () => {
    const { location_name, building, room } = form;

    if (!location_name.trim()) return toast.error("Location name is required");
    if (!building.trim()) return toast.error("Building is required");
    if (!room || isNaN(room)) return toast.error("Room must be an integer");

    try {
      if (editing) {
        // Update
        await api.put(`/locations/${editing.location_id}`, {
          ...form,
          user_id: user.user_id,
        });
        toast.success("Location updated");
      } else {
        // Create
        await api.post("/locations", {
          ...form,
          user_id: user.user_id,
        });
        toast.success("Location added");
      }

      resetForm();
      loadLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save location");
    }
  };

  const handleDelete = async (loc) => {
    try {
      await api.delete(`/locations/${loc.location_id}`, {
        data: { user_id: user.user_id },
      });

      toast.success("Location deleted");
      loadLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete location");
    }
  };

  if (!isGlobalAdmin) {
    return (
      <div className="p-6 text-red-600 font-semibold text-center">
        You do not have permission to manage locations.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1>Manage Campus Locations</h1>
        <p className="text-muted-foreground">Add, edit, and remove campus locations</p>
      </div>

      {/* FORM */}
      <div className="border rounded-md p-5 space-y-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {editing ? "Edit Location" : "Add New Location"}
        </h2>

        <Input
          placeholder="Location Name"
          value={form.location_name}
          onChange={(e) => setForm({ ...form, location_name: e.target.value })}
        />

        <Input
          placeholder="Building"
          value={form.building}
          onChange={(e) => setForm({ ...form, building: e.target.value })}
        />

        <Input
          placeholder="Room Number"
          value={form.room}
          onChange={(e) => setForm({ ...form, room: e.target.value })}
        />

        <Button onClick={handleAddOrEdit} className="w-full">
          {editing ? "Save Changes" : "Add Location"}
        </Button>

        {editing && (
          <Button
            variant="outline"
            onClick={resetForm}
            className="w-full text-gray-600"
          >
            Cancel Editing
          </Button>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Existing Locations ({locations.length})
        </h2>

        {locations.map((loc) => (
          <div
            key={loc.location_id}
            className="flex items-center justify-between border p-3 rounded-md bg-white shadow-sm"
          >
            <div>
              <p className="font-medium">{loc.location_name}</p>
              <p className="text-sm text-muted-foreground">
                {loc.building} — Room {loc.room}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(loc);
                  setForm({
                    location_name: loc.location_name,
                    building: loc.building,
                    room: loc.room,
                  });
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(loc)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
