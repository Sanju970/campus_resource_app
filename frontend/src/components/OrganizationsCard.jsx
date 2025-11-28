import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Clock, Phone, Trash2, Pencil } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useState } from "react";

export default function OrganizationsCard({
  resource,
  onJoin,
  onEdit,
  onDelete,
  isMember,
  userRole,
  categories = [],
}) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  const stop = (e) => e.stopPropagation();

  const joined = Boolean(isMember || resource?.is_member);
  const orgRole = resource.current_org_role;

  const isOnlyAdminDelegate =
    orgRole === "admin_delegate" &&
    resource.admin_delegate_count === 1;

  const isOnlyLeadFaculty =
    orgRole === "lead_faculty" &&
    resource.lead_faculty_count === 1;

  const cannotLeave = isOnlyAdminDelegate || isOnlyLeadFaculty;

  const isGlobalAdmin =
    userRole === "admin" || userRole === 3 || userRole === "3";

  const canManageOrg =
    isGlobalAdmin ||
    orgRole === "admin_delegate" ||
    orgRole === "lead_faculty";

  const category = categories.find((c) => c.id === resource.category_id);

const formattedLocation =
  resource.location_name
    ? `${resource.location_name}${
        resource.building ? ` — ${resource.building}` : ""
      }${resource.room ? ` — Room ${resource.room}` : ""}`
    : resource.legacy_location;

    // --- add these to enable light-mode-only green glow ---
  const isLightMode =
    typeof document !== "undefined" &&
    !document.documentElement.classList.contains("dark");

  // base classes (keeps existing hover/shadow behavior)
  const baseCardClasses = "transition-shadow border hover:shadow-lg";

  // when joined: slightly different handling for light vs dark
  const joinedLightClasses = "overflow-visible border-green-500";
  const joinedDarkClasses = "overflow-hidden dark:border-gray-700 dark:bg-transparent";

  // when not joined
  const notJoinedClasses = "overflow-hidden border-gray-200 dark:border-gray-700";

  // final class + inline style (only add boxShadow for light mode)
  const cardClass = joined
    ? `${baseCardClasses} ${isLightMode ? joinedLightClasses : joinedDarkClasses}`
    : `${baseCardClasses} ${notJoinedClasses}`;

  const cardStyle =
    joined && isLightMode
      ? {
          backgroundColor: "#ecfdf3", // same light-green background you used earlier
          // subtle glow + outer ring — tweak values if you want stronger/weaker glow
          boxShadow:
            "0 12px 30px rgba(16,185,129,0.06), 0 0 0 6px rgba(16,185,129,0.08)",
        }
      : undefined;


  return (
    <Card
      className={cardClass}
      style={cardStyle}
      onClick={(e) => {
        // prevent navigation while delete dialog is open
        if (deleteDialogOpen) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        navigate(`/organizations/${resource.id}`);
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-wrap gap-2">
            {category && (
              <Badge className="bg-purple-100 text-purple-800">
                {category.name}
              </Badge>
            )}

            {joined && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white border border-green-600 shadow-sm">
                Member
              </span>
            )}

            {canManageOrg && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300 shadow-sm">
                You manage this
              </span>
            )}
          </div>
        </div>

        <CardTitle className="text-lg">{resource.title}</CardTitle>

        {resource.description && (
          <CardDescription>{resource.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ORG DETAILS */}
        <div className="space-y-2 text-sm">

          {/* 🌍 LOCATION FIXED */}
          {formattedLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formattedLocation}</span>
            </div>
          )}

          {resource.hours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{resource.hours}</span>
            </div>
          )}

          {resource.contact && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{resource.contact}</span>
            </div>
          )}
        </div>

        {/* MANAGEMENT BUTTONS */}
        {canManageOrg && (
          <div className="w-full space-y-2">
            <Button
              size="sm"
              onClick={(e) => {
                stop(e);
                onEdit && onEdit(resource);
              }}
              className="w-full"
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit Organization
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                stop(e);
                setOrgToDelete(resource);
                setDeleteDialogOpen(true);
              }}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Organization
            </Button>
          </div>
        )}

        {/* JOIN / LEAVE */}
        <div className="w-full space-y-2 mt-2">
          {joined ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                disabled={cannotLeave}
                onClick={(e) => {
                  stop(e);
                  onJoin(resource, true);
                }}
                className="w-full"
              >
                Leave Organization
              </Button>

              {cannotLeave && (
                <p className="text-xs text-red-600">
                  You are the only {orgRole?.replace("_", " ")}.  
                  Assign your role before leaving.
                </p>
              )}
            </>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                stop(e);
                onJoin(resource, false);
              }}
            >
              Join Organization
            </Button>
          )}
        </div>
      </CardContent>
      {/* DELETE ORG CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization?</DialogTitle>
            <DialogDescription>
              {orgToDelete
                ? `Are you sure you want to delete "${orgToDelete.title}"? This action cannot be undone.`
                : "Are you sure you want to delete this organization?"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setOrgToDelete(null);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (orgToDelete && onDelete) onDelete(orgToDelete);
                setDeleteDialogOpen(false);
                setOrgToDelete(null);
              }}
            >
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </Card>
  );
}

OrganizationsCard.propTypes = {
  resource: PropTypes.object.isRequired,
  onJoin: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isMember: PropTypes.bool,
  userRole: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  categories: PropTypes.array,
};
