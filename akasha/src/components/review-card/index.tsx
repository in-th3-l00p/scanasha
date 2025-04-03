import { ContentCard, ContentCardBody } from '@/components/ui/content-card';
import { Typography } from '@/components/ui/typography';
import { useGetProfileByDidQuery } from '@akashaorg/ui-core-hooks/lib/generated';
import { selectProfileData } from '@akashaorg/ui-core-hooks/lib/selectors/get-profile-by-did-query';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
  completed: 'bg-green-500/10 text-green-500 border-green-500/50',
};

const ReviewCard = ({
  reviewId,
  contractName,
  description,
  address,
  status,
  authorDID,
  publishedAt,
}: Omit<
  React.ComponentProps<typeof ContentCard> & {
    reviewId: string;
    contractName: string;
    description: string;
    address: string;
    status: 'pending' | 'in_progress' | 'completed';
    authorDID: string;
  },
  'author'
>) => {
  const profileDataRes = useGetProfileByDidQuery({ variables: { id: authorDID } });

  const author = useMemo(() => {
    if (profileDataRes.data) {
      return selectProfileData(profileDataRes.data);
    }
    return undefined;
  }, [profileDataRes]);

  return (
    <ContentCard
      author={{ did: author?.did.id || '', name: author?.name || 'Unknown' }}
      publishedAt={publishedAt}
    >
      <ContentCardBody className="flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <Typography variant="sm" bold>
            {contractName}
          </Typography>
          <Badge className={statusColors[status]}>
            {status === 'in_progress' ? 'In progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        
        <Typography variant="sm">{description}</Typography>
        
        <div className="bg-muted/20 rounded-md p-3 mt-2">
          <Typography variant="xs" className="text-muted-foreground">
            Contract Address
          </Typography>
          <Typography variant="sm" className="font-mono break-all">
            {address}
          </Typography>
        </div>
      </ContentCardBody>
    </ContentCard>
  );
};

export { ReviewCard }; 