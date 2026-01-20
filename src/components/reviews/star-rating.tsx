import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  maxRating?: number;
}

export default function StarRating({ rating, maxRating = 5, className, ...props }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-0.5', className)} {...props}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && <Star key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 fill-muted text-muted-foreground" />
      ))}
    </div>
  );
}

    