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
  isAdminView,
}) {
  const navigate = useNavigate();
  const joined = Boolean(isMember || resource?.is_member);

  return (
    <Card className="hover:shadow-lg transition-shadow rounded-xl border border-gray-200 bg-white flex flex-col justify-between">

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

      <CardContent className="space-y-3 text-sm flex flex-col flex-grow">

        {resource.location && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{resource.location}</span>
          </div>
        )}

        {resource.hours && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{resource.hours}</span>
          </div>
        )}

        {resource.contact && (
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{resource.contact}</span>
          </div>
        )}
        {/* HEAD NAME */}
        {resource.head_user_name && (
          <div className="flex items-start gap-2 text-sm">
            <span className="font-semibold">Org Head:</span>
            <span>{resource.head_user_name}</span>
          </div>
        )}

        {/* HEAD CONTACT */}
        {resource.head_user_email && (
          <div className="flex items-start gap-2 text-sm">
            <span className="font-semibold">Head Contact:</span>
            <a href={`mailto:${resource.head_user_email}`} className="text-blue-600 underline">
              {resource.head_user_email}
            </a>
          </div>
        )}

        {/* FOOTER SECTION – Matches Events Page */}
        <div className="pt-3 mt-auto">

          <div className="text-xs text-gray-500 flex gap-1 items-center mb-3">
            <Users className="h-4 w-4" />
            {resource.member_count ?? 0} members
          </div>
          <div
            className="text-blue-600 underline cursor-pointer text-sm"
            onClick={() => navigate(`/organizations/${resource.id}/members`)}
          >
            View Members
          </div>

          {/* JOIN */}
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


          {/* ADMIN ACTIONS */}
          {isAdminView && (
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
  isAdminView: PropTypes.bool,
};
