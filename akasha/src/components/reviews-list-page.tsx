import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Stack } from '@/components/ui/stack';
import { useNavigate } from '@tanstack/react-router';
import { FeedCTA } from '@/components/ui/feed-cta';
import { useAkashaStore, useRootComponentProps } from '@akashaorg/ui-core-hooks';
import { useCallback, useEffect, useState } from 'react';
import { getReviews } from '@/api';
import { Review, isReviewsResponse, isErrorResponse } from '@/api/types';
import { ReviewCard } from './review-card';

const ReviewsListPage = () => {
  const {
    data: { authenticatedDID },
  } = useAkashaStore();

  const { navigateToModal } = useRootComponentProps();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const res = await getReviews();
      setIsLoading(false);
      
      if (isErrorResponse(res)) {
        setError(res.error);
        return;
      }
      
      if (isReviewsResponse(res) && res.data?.reviewIndex?.edges) {
        setReviews(res.data.reviewIndex.edges.map(edge => edge.node));
      }
    };
    
    fetchReviews();
  }, []);

  const handleCreateReviewClick = useCallback(() => {
    if (!authenticatedDID) {
      alert('Please login to create a review');
      navigateToModal({
        name: 'login',
        redrectTo: location.pathname,
      });
      return;
    }
    
    navigate({
      to: '/create-review',
    });
  }, [authenticatedDID, navigateToModal, navigate]);

  return (
    <Stack spacing={4}>
      <FeedCTA
        avatarSrc="https://github.com/akashaorg.png"
        profileDID={authenticatedDID}
        cta="Start a smart contract review to ensure its security and reliability!"
      >
        <Button size="sm" onClick={handleCreateReviewClick}>
          Create Review
        </Button>
      </FeedCTA>
      
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <Typography variant="sm" bold>
              Loading reviews...
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <Typography variant="sm" bold>
              Error loading reviews: {error}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && reviews.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <Typography variant="h4" className="mb-4">
              Smart Contract Reviews
            </Typography>
            
            <Typography variant="sm">
              No reviews found. Start by creating a review for a smart contract!
            </Typography>
          </CardContent>
        </Card>
      )}

      {reviews.map(review => (
        <ReviewCard
          key={review.id}
          reviewId={review.id}
          contractName={review.contractName}
          description={review.description}
          address={review.address}
          status={review.status as 'pending' | 'in_progress' | 'completed'}
          authorDID={review.author.id}
          publishedAt={`${new Date(review.createdAt).toDateString()} - ${new Date(
            review.createdAt
          ).toLocaleTimeString()}`}
        />
      ))}
    </Stack>
  );
};

export default ReviewsListPage; 