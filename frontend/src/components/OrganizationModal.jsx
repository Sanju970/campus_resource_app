// ======================= OrganizationModal.jsx =========================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { toast } from "sonner";

const TIME_OPTIONS = [
  "6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
  "6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

function convertToMinutes(timeStr) {
  if (!timeStr) return null;

  let [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (isNaN(minutes)) minutes = 0;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export default function OrganizationModal({
  open,
  setOpen,
  form,
  setForm,
  onSave,
  categories = [],
  admins = [],
  locations = [],
  isEdit = false,
  canTransferAdmin = false,
}) {

  const validateTimes = () => {
    const check = (days, start, end, label) => {
      if (!days || !start || !end) return true;

      const s = convertToMinutes(start);
      const e = convertToMinutes(end);

      if (e <= s) {
        toast.error(`${label}: End time must be after start time.`);
        return false;
      }
      return true;
    };

    if (!check(form.hours_days_main, form.hours_start_main, form.hours_end_main, "Primary Hours")) return false;
    if (!check(form.hours_days_secondary, form.hours_start_secondary, form.hours_end_secondary, "Secondary Hours")) return false;

    return true;
  };

  const handleSave = () => {
    if (!form.location_id) return toast.error("Please select a location.");
    if (!validateTimes()) return;
    onSave();
  };

  const renderHoursBlock = (label, daysKey, startKey, endKey, isOptional = false) => (
    <div className="space-y-2">
      <Label>
        {label}
        {isOptional && (
          <span className="text-xs text-muted-foreground ml-1">(optional)</span>
        )}
      </Label>

      <select
        className="border rounded-md w-full p-2 text-sm sm:text-base"
        value={form[daysKey] || ""}
        onChange={(e) => setForm({ ...form, [daysKey]: e.target.value })}
      >
        <option value="">Select Days</option>
        <option value="Mon–Fri">Mon–Fri</option>
        <option value="Sat–Sun">Sat–Sun</option>
        <option value="Mon–Sun">Mon–Sun</option>
        <option value="Mon–Thu">Mon–Thu</option>
        <option value="Custom">Custom</option>
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          className="border rounded-md w-full p-2 text-sm sm:text-base"
          value={form[startKey] || ""}
          onChange={(e) => setForm({ ...form, [startKey]: e.target.value })}
        >
          <option value="">Start Time</option>
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="border rounded-md w-full p-2 text-sm sm:text-base"
          value={form[endKey] || ""}
          onChange={(e) => setForm({ ...form, [endKey]: e.target.value })}
        >
          <option value="">End Time</option>
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const primaryPreview =
    form.hours_days_main &&
    form.hours_start_main &&
    form.hours_end_main
      ? `${form.hours_days_main}: ${form.hours_start_main} – ${form.hours_end_main}`
      : "";

  const secondaryPreview =
    form.hours_days_secondary &&
    form.hours_start_secondary &&
    form.hours_end_secondary
      ? `${form.hours_days_secondary}: ${form.hours_start_secondary} – ${form.hours_end_secondary}`
      : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto sm:w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Organization" : "Create Organization"}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 sm:py-4 px-1 sm:px-0">
          {/* TITLE */}
          <div className="space-y-2">
            <Label>Organization Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* CATEGORY */}
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="border rounded-md w-full p-2 text-sm sm:text-base"
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: Number(e.target.value) })
              }
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* LOCATION DROPDOWN */}
          <div className="space-y-2">
            <Label>Location</Label>

            <select
              className="border rounded-md w-full p-2 text-sm sm:text-base"
              value={form.location_id || ""}
              onChange={(e) =>
                setForm({ ...form, location_id: Number(e.target.value) })
              }
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                  {loc.building ? ` — ${loc.building}` : ""}
                  {loc.room ? ` — Room ${loc.room}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* HOURS */}
          <div className="space-y-4">
            <Label>Operating Hours</Label>
            <p className="text-xs text-muted-foreground">
              Times are US Central Time.
            </p>

            {renderHoursBlock(
              "Primary Hours",
              "hours_days_main",
              "hours_start_main",
              "hours_end_main"
            )}

            {renderHoursBlock(
              "Secondary Hours",
              "hours_days_secondary",
              "hours_start_secondary",
              "hours_end_secondary",
              true
            )}

            {(primaryPreview || secondaryPreview) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-1">
                <p className="font-medium text-blue-800">Preview:</p>
                {primaryPreview && <p>• {primaryPreview}</p>}
                {secondaryPreview && <p>• {secondaryPreview}</p>}
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Must be a 10-digit phone number (numbers only)
            </p>
          </div>

          {/* WEBSITE */}
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          {/* ADMIN TRANSFER */}
          {isEdit && canTransferAdmin && (
            <div className="space-y-3 border border-orange-300 p-3 sm:p-4 rounded-md bg-orange-50">
              <span className="text-orange-600 font-semibold">
                Admin Delegate Transfer
              </span>

              <div className="space-y-2">
                <Label>Select Global Admin</Label>
                <select
                  className="border rounded-md w-full p-2 text-sm sm:text-base"
                  value={form.new_admin_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, new_admin_id: Number(e.target.value) })
                  }
                >
                  <option value="">Select Admin</option>
                  {admins.map((adm) => (
                    <option key={adm.user_id} value={adm.user_id}>
                      {adm.first_name} {adm.last_name} — {adm.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* SAVE BUTTON */}
          <Button onClick={handleSave} className="w-full">
            {isEdit ? "Save Changes" : "Create Organization"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
