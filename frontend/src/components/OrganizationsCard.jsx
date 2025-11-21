import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Clock, Mail, Trash2, Pencil } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "../styles/ripple.css";

export default function OrganizationsCard({
  resource,
  onJoin,
  onEdit,
  onDelete,
  isMember,
  userRole,
}) {
  const navigate = useNavigate();
  const joined = Boolean(isMember || resource?.is_member);

  const isGlobalAdmin =
    userRole === "admin" || userRole === 3 || userRole === "3";
  const canManageOrg = isGlobalAdmin || resource.is_org_admin === 1;

  const stop = (e) => e.stopPropagation();

  return (
    <Card
      className="
        group
        relative
        flex flex-col
        rounded-xl
        border border-border
        bg-card
        shadow-md
        hover:shadow-lg
        transition-shadow
        cursor-pointer
        overflow-hidden
        ripple
      "
      onClick={() => navigate(`/organizations/${resource.id}`)}
    >
      {/* subtle top highlight */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-500/60 via-blue-500/60 to-pink-500/60 opacity-80" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold leading-snug line-clamp-1 group-hover:text-blue-500 transition-colors">
              {resource.title}
            </CardTitle>
            {resource.description && (
              <CardDescription className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {resource.description}
              </CardDescription>
            )}
          </div>

          {/* Membership / Admin chip */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {joined && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-500 font-medium">
                Member
              </span>
            )}

            {canManageOrg && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-500 font-medium">
                You manage this
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 px-4 pb-4 pt-0 text-sm text-foreground">
        <div className="space-y-2.5 mt-1">
          {resource.location && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{resource.location}</span>
            </div>
          )}

          {resource.hours && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5" />
              <span>{resource.hours}</span>
            </div>
          )}

          {resource.contact && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5" />
              <span>{resource.contact}</span>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-4 flex items-center gap-2">
          {onJoin && (
            <Button
              size="sm"
              className={`flex-1 ${
                joined
                  ? "bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                  : ""
              }`}
              variant={joined ? "destructive" : "default"}
              onClick={(e) => {
                stop(e);
                onJoin(resource, joined);
              }}
            >
              {joined ? "Leave" : "Join"}
            </Button>
          )}

          {canManageOrg && (onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9"
                  onClick={(e) => {
                    stop(e);
                    onEdit(resource);
                  }}
                  title="Edit organization"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 text-destructive border-destructive/40 hover:bg-destructive/5"
                  onClick={(e) => {
                    stop(e);
                    onDelete(resource);
                  }}
                  title="Remove organization"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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
};
