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

export default function OrganizationModal({
  open,
  setOpen,
  form,
  setForm,
  onSave,
  categories = [],
  faculty = [],
  isEdit = false,
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DO NOT PUT overflow HERE */}
      <DialogContent className="sm:max-w-xl">

        {/* HEADER */}
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Organization" : "Create Organization"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below.
          </DialogDescription>

          <DialogClose className="absolute right-4 top-4 cursor-pointer" />
        </DialogHeader>

        {/* 👇 SCROLL CONTAINER (ONLY this should scroll) */}
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-5 mt-4">

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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <Label>Category</Label>
            <select
              className="border rounded-md w-full p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.category_key} value={c.category_key}>
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
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* HOURS */}
          <div>
            <Label>Hours</Label>
            <Input
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          </div>

          {/* CONTACT */}
          <div>
            <Label>Contact</Label>
            <Input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>

          {/* WEBSITE */}
          <div>
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          {/* HEAD CONTACT */}
          <div>
            <Label>Organization Head (Faculty)</Label>
            <select
              className="border rounded-md w-full p-2"
              value={form.head_contact}
              onChange={(e) => {
                const selected = faculty.find(
                  (f) => f.email === e.target.value
                );

                setForm({
                  ...form,
                  head_contact: e.target.value,
                  head_name: selected
                    ? `${selected.first_name} ${selected.last_name}`
                    : "",
                });
              }}
            >
              <option value="">Select Faculty</option>
              {faculty.map((f) => (
                <option key={f.user_id} value={f.email}>
                  {f.first_name} {f.last_name} — {f.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Head Name</Label>
            <Input
              value={form.head_name}
              readOnly
              className="bg-gray-100"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-3">
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
