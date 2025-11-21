import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Clock, Mail, Trash2, Pencil } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

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
  const stop = (e) => e.stopPropagation();

  // User membership
  const joined = Boolean(isMember || resource?.is_member);

  // Extract the user's org-level role
  const orgRole = resource.current_org_role;

  // Leave restriction logic
  const isOnlyAdminDelegate =
    orgRole === "admin_delegate" &&
    resource.admin_delegate_count === 1;

  const isOnlyLeadFaculty =
    orgRole === "lead_faculty" &&
    resource.lead_faculty_count === 1;

  const cannotLeave = isOnlyAdminDelegate || isOnlyLeadFaculty;

  // Global admin detection
  const isGlobalAdmin =
    userRole === "admin" || userRole === 3 || userRole === "3";

  // Edit/Delete are allowed by:
  // - global admin
  // - admin_delegate
  // - lead_faculty
  const canManageOrg =
    isGlobalAdmin ||
    orgRole === "admin_delegate" ||
    orgRole === "lead_faculty";

  const category = categories.find((c) => c.id === resource.category_id);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow border"
      style={joined ? { backgroundColor: "#ecfdf3" } : undefined}
      onClick={() => navigate(`/organizations/${resource.id}`)}
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
          {resource.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{resource.location}</span>
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
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{resource.contact}</span>
            </div>
          )}
        </div>

        {/* MANAGEMENT BUTTONS (Edit/Delete) */}
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
                onDelete && onDelete(resource);
              }}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Organization
            </Button>
          </div>
        )}

        {/* JOIN / LEAVE BUTTONS — ALWAYS SHOWN FOR EVERY USER */}
        <div className="w-full space-y-2 mt-2">
          {joined ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                disabled={cannotLeave}
                onClick={(e) => {
                  stop(e);
                  onJoin(resource, true); // leave
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
                onJoin(resource, false); // join
              }}
            >
              Join Organization
            </Button>
          )}
        </div>
      </CardContent>
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
