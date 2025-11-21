import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";

import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

const TIME_OPTIONS = [
  "6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
  "6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

export default function OrganizationModal({
  open,
  setOpen,
  form,
  setForm,
  onSave,
  categories = [],
  faculty = [],   // kept for compatibility, not used now
  admins = [],
  isEdit = false,
}) {
  console.log("🔍 OrgModal Debug:", {
    isEdit,
    form_keys: Object.keys(form),
    admins_count: admins.length,
  });

  const renderHoursBlock = (
    label,
    daysKey,
    startKey,
    endKey,
    isOptional = false
  ) => (
    <div className="space-y-2">
      <Label>
        {label}
        {isOptional && (
          <span className="text-xs text-muted-foreground"> (optional)</span>
        )}
      </Label>

      <select
        className="border rounded-md w-full p-2"
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

      <div className="flex gap-2">
        <select
          className="border rounded-md w-1/2 p-2"
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
          className="border rounded-md w-1/2 p-2"
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

  const showAdminTransfer = isEdit && admins.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        {/* HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {isEdit ? "Edit Organization" : "Create Organization"}
          </DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
          <DialogClose className="absolute right-4 top-4 cursor-pointer" />
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {/* TITLE */}
            <div>
              <Label>Organization Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* CATEGORY */}
            <div>
              <Label>Category</Label>
              <select
                className="border rounded-md w-full p-2"
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

            {/* LOCATION */}
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>

            {/* HOURS */}
            <div className="space-y-3">
              <Label>Operating Days & Hours</Label>

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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-sm space-y-1">
                  <p className="font-medium">Preview:</p>
                  {primaryPreview && <p>• {primaryPreview}</p>}
                  {secondaryPreview && <p>• {secondaryPreview}</p>}
                </div>
              )}
            </div>

            {/* CONTACT */}
            <div>
              <Label>Contact</Label>
              <Input
                value={form.contact}
                onChange={(e) =>
                  setForm({ ...form, contact: e.target.value })
                }
              />
            </div>

            {/* WEBSITE */}
            <div>
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>

            {/* ADMIN-DELEGATE TRANSFER (optional) */}
            {showAdminTransfer && (
              <div className="space-y-2 border-2 border-orange-300 p-4 rounded-md bg-orange-50">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-semibold">
                    ⚠️ Admin Delegate Transfer
                  </span>
                </div>

                <Label className="font-medium">
                  Transfer admin_delegate role to:
                </Label>

                <select
                  className="border rounded-md w-full p-2 bg-white"
                  value={form.new_admin_id || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      new_admin_id: Number(e.target.value),
                    })
                  }
                >
                  <option value="">Select Global Admin</option>
                  {admins.map((adm) => (
                    <option key={adm.user_id} value={adm.user_id}>
                      {adm.first_name} {adm.last_name} — {adm.email}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-orange-700 bg-orange-100 border border-orange-200 rounded p-2">
                  Optional: If you plan to step down as admin_delegate, choose
                  another global admin to take over. Backend will enforce that
                  at least one admin_delegate remains.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-gray-100">
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button onClick={onSave}>
              {isEdit ? "Save Changes" : "Create Organization"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
