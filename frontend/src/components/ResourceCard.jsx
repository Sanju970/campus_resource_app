import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Clock, Mail, ExternalLink, Users, Trash2, Pencil } from 'lucide-react';
import PropTypes from 'prop-types';
import { ImageWithFallback } from './FallbackImg/ImageWithFallback';

export default function ResourceCard({
  resource,
  onViewDetails,
  onJoin,
  onEdit,
  onDelete,
  isMember,
  isAdminView,
}) {
  const joined = Boolean(isMember || resource?.is_member);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {resource?.image && (
        <div className="h-48 overflow-hidden">
          <ImageWithFallback
            src={resource.image}
            alt={resource.title || 'Resource Image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader>
        <CardTitle>{resource?.title}</CardTitle>
        {resource?.description && (
          <CardDescription>{resource.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {resource?.location && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span>{resource.location}</span>
          </div>
        )}

        {resource?.hours && (
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span>{resource.hours}</span>
          </div>
        )}

        {resource?.contact && (
          <div className="flex items-start gap-2 text-sm">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span>{resource.contact}</span>
          </div>
        )}

        {/* Optional: tags / keywords */}
        {Array.isArray(resource?.tags) && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Membership / actions row */}
        <div className="flex flex-wrap gap-2 pt-2 items-center">
          {typeof resource.member_count !== 'undefined' && (
            <div className="flex items-center text-xs text-muted-foreground mr-2">
              <Users className="h-4 w-4 mr-1" />
              <span>{resource.member_count} members</span>
            </div>
          )}

          {resource?.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={
                  resource.website.startsWith('http')
                    ? resource.website
                    : `https://${resource.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </a>
            </Button>
          )}

          {onJoin && (
            <Button
              variant={joined ? 'outline' : 'default'}
              size="sm"
              disabled={joined}
              onClick={() => {
                if (!joined) onJoin(resource);
              }}
            >
              <Users className="h-4 w-4 mr-1" />
              {joined ? 'Joined' : 'Join Organization'}
            </Button>
          )}

          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(resource)}
            >
              View Details
            </Button>
          )}

          {isAdminView && (
            <>
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
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
                  onClick={() => onDelete(resource)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    location: PropTypes.string,
    hours: PropTypes.string,
    contact: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    website: PropTypes.string,
    member_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    is_member: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  }).isRequired,
  onViewDetails: PropTypes.func,
  onJoin: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isMember: PropTypes.bool,
  isAdminView: PropTypes.bool,
};
