import type { Review } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StarRating from './star-rating';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';

export default function ReviewCard({ review }: { review: Review }) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Card className="bg-background/80">
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar>
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.clientName}`} alt={review.clientName} />
          <AvatarFallback>{getInitials(review.clientName)}</AvatarFallback>
        </Avatar>
        <div className='flex-1'>
            <CardTitle className="text-base">{review.clientName}</CardTitle>
             <div className="text-xs text-muted-foreground">
              {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'PPP') : 'Recently'}
            </div>
        </div>
        <StarRating rating={review.rating} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90">{`"${review.comment}"`}</p>
      </CardContent>
      {review.services && review.services.length > 0 && (
        <CardFooter className="flex-wrap gap-2">
            {review.services.map(service => (
                <Badge key={service.id} variant="secondary">{service.name}</Badge>
            ))}
        </CardFooter>
      )}
    </Card>
  );
}

    