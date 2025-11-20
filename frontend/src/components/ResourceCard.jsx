import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Clock, Mail, Users, Trash2, Pencil } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export default function ResourceCard({
  resource,
  onJoin,
  onEdit,
  onDelete,
  isMember,
  role,
}) {
  const navigate = useNavigate();
  const joined = Boolean(isMember || resource?.is_member);

  return (
    <Card className="hover:shadow-lg transition-shadow rounded-xl border border-gray-200 bg-white flex flex-col justify-between">

      {/* HEADER */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold leading-tight">
          {resource.title}
        </CardTitle>

        {resource.description && (
          <CardDescription className="text-sm leading-relaxed text-gray-600">
            {resource.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="space-y-3 text-sm flex flex-col flex-grow">

        {/* LOCATION */}
        {resource.location && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{resource.location}</span>
          </div>
        )}

        {/* HOURS */}
        {resource.hours && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{resource.hours}</span>
          </div>
        )}

        {/* CONTACT */}
        {resource.contact && (
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{resource.contact}</span>
          </div>
        )}

        {/* FOOTER */}
        <div className="pt-3 mt-auto">

          {/* VIEW MEMBERS */}
          <Button
            size="sm"
            variant="outline"
            className="w-full mb-2 flex items-center justify-center gap-2"
            onClick={() => navigate(`/organizations/${resource.id}/members`)}
          >
            <Users className="h-4 w-4" />
            View Members ({resource.member_count ?? 0})
          </Button>

          {/* JOIN / LEAVE */}
          {onJoin && (
            !joined ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onJoin(resource)}
              >
                Join
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => onJoin(resource, true)}
              >
                Leave
              </Button>
            )
          )}

          {/* ORG-ADMIN ACTIONS */}
          {role === "admin" && (onEdit || onDelete) && (
            <div className="flex gap-2 mt-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(resource)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onDelete(resource)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.object.isRequired,
  onJoin: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isMember: PropTypes.bool,
};
