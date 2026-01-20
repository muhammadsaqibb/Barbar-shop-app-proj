import ReviewsList from "@/components/reviews/reviews-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewsPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline text-center uppercase">Client Reviews</CardTitle>
                        <CardDescription className="text-center text-muted-foreground pt-2">
                           What our clients are saying about their experience.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReviewsList />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
