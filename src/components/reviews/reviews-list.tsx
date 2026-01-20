'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Review } from '@/types';
import { Skeleton } from '../ui/skeleton';
import ReviewCard from './review-card';

export default function ReviewsList() {
  const { firestore } = useFirebase();

  const reviewsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: reviews, isLoading, error } = useCollection<Review>(reviewsQuery);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center py-8">Failed to load reviews. Please try again later.</p>;
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground text-center py-8">There are no reviews yet. Be the first to leave one!</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

    