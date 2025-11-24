// ======================= LocationsPage.jsx =========================

import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Trash2, Building2, MapPin } from "lucide-react";

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    location_name: "",
    building: "",
    room: "",
  });

  const isGlobalAdmin =
    user?.role === "admin" || user?.role === 3 || user?.role === "3";

  const loadLocations = () => {
    axios
      .get("http://localhost:5000/api/locations")
      .then((res) => setLocations(res.data))
      .catch(() => toast.error("Failed to load locations"));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAdd = async () => {
    if (!form.location_name.trim()) {
      toast.error("Location name is required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/locations", {
        ...form,
        user_id: user.user_id,
      });

      toast.success("Location added");
      setForm({ location_name: "", building: "", room: "" });
      loadLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add location");
    }
  };

  const handleDelete = async (loc) => {
    if (!window.confirm(`Delete location "${loc.location_name}"?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/locations/${loc.location_id}`,
        {
          data: { user_id: user.user_id },
        }
      );

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
        <p className="text-muted-foreground">
          Add, view, and remove official campus locations
        </p>
      </div>

      <div className="border rounded-md p-5 space-y-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Add New Location
        </h2>

        <Input
          placeholder="Location Name (Ex: Central Library)"
          value={form.location_name}
          onChange={(e) =>
            setForm({ ...form, location_name: e.target.value })
          }
        />

        <Input
          placeholder="Building (optional)"
          value={form.building}
          onChange={(e) => setForm({ ...form, building: e.target.value })}
        />

        <Input
          placeholder="Room (optional)"
          value={form.room}
          onChange={(e) => setForm({ ...form, room: e.target.value })}
        />

        <Button onClick={handleAdd} className="w-full">
          Add Location
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Existing Locations
        </h2>

        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No locations added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div
                key={loc.location_id}
                className="flex items-center justify-between border p-3 rounded-md bg-white shadow-sm"
              >
                <div>
                  <p className="font-medium">{loc.location_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {loc.building || "No building"} —{" "}
                    {loc.room || "No room number"}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(loc)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
