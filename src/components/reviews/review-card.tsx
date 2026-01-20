import type { Review } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from './star-rating';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Scissors, User } from 'lucide-react';

export default function ReviewCard({ review }: { review: Review }) {
  const timeAgo = review.createdAt?.toDate ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : 'a while ago';

  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
            <AvatarFallback>{review.clientName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{review.clientName}</CardTitle>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <div className="mt-1">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </CardHeader>
      {review.comment && (
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-foreground/80">"{review.comment}"</p>
        </CardContent>
      )}
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        {review.barberName && (
            <Badge variant="secondary">
                <User className="mr-1.5 h-3 w-3" />
                {review.barberName}
            </Badge>
        )}
        {review.services?.map((service, index) => (
          <Badge key={index} variant="outline">
            <Scissors className="mr-1.5 h-3 w-3" />
            {service.name}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
