import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Clock, Mail, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';
import { ImageWithFallback } from './FallbackImg/ImageWithFallback';

export default function ResourceCard({ resource, onViewDetails }) {
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

        <div className="flex flex-wrap gap-2">
          {(resource?.tags || []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {resource?.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://${resource.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </a>
            </Button>
          )}

          {onViewDetails && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(resource)}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    location: PropTypes.string,
    hours: PropTypes.string,
    contact: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    website: PropTypes.string,
  }).isRequired,
  onViewDetails: PropTypes.func,
};
