import { Button } from '@/components/ui/button';
import { FeedCTA } from '@/components/ui/feed-cta';
import { Stack } from '@/components/ui/stack';
import { PollCard } from '@/components/poll-card';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAkashaStore, useRootComponentProps } from '@akashaorg/ui-core-hooks';
import { getAllPollsWithVotes } from '@/api';
import { Card, CardContent } from './ui/card';
import { Typography } from './ui/typography';
import { getOptionPercentage } from '@/lib/utils';

const PollPage = () => {
  const {
    data: { authenticatedDID },
  } = useAkashaStore();

  const { navigateToModal, getCorePlugins } = useRootComponentProps();

  const [isLoadingPolls, setIsLoadingPolls] = useState(false);
  const [allPollsWithVotes, setAllPollsWithVotes] =
    useState<Awaited<ReturnType<typeof getAllPollsWithVotes>>['data']>();

  const navigate = useNavigate();

  const handleEditorPlaceholderClick = useCallback(() => {
    if (!authenticatedDID) {
      alert('Please login to create a poll');
      navigateToModal({
        name: 'login',
        redrectTo: location.pathname,
      });
      return;
    }
    getCorePlugins().routing.navigateTo({
      appName: '@akashaorg/app-antenna',
      getNavigationUrl: () => '/editor',
    });
  }, [authenticatedDID, navigate]);

  useEffect(() => {
    const getPollsWithVotes = async () => {
      setIsLoadingPolls(true);
      const res = await getAllPollsWithVotes();
      setIsLoadingPolls(false);
      if (res.error) {
        return;
      }
      setAllPollsWithVotes(res.data);
    };
    getPollsWithVotes();
  }, []);

  return (
    <Stack spacing={4}>
      <FeedCTA
        avatarSrc="https://github.com/akashaorg.png"
        profileDID={authenticatedDID}
        cta="Unleash the Meow! 🐾 Create Your Purr-fect Poll!"
      >
        <Button size="sm" onClick={handleEditorPlaceholderClick}>
          Create Poll
        </Button>
      </FeedCTA>
      {isLoadingPolls && (
        <Card>
          <CardContent>
            <Typography variant="sm" bold>
              Loading Polls...
            </Typography>
          </CardContent>
        </Card>
      )}
      {!isLoadingPolls && !allPollsWithVotes?.pollsWithVotes.length && (
        <Card>
          <CardContent>
            <Typography variant="sm" bold>
              No polls created yet!
            </Typography>
          </CardContent>
        </Card>
      )}
      {allPollsWithVotes?.pollsWithVotes.map(poll => (
        <PollCard
          pollId={poll.node.id}
          title={poll.node.title}
          selectedOptions={poll.votes.filter(
            vote => vote.voter.id === authenticatedDID && vote.pollID === poll.node.id,
          )}
          description={poll.node.description}
          options={poll.node.options.map(opt => ({
            id: opt.id,
            name: opt.name,
            percentage: getOptionPercentage(
              opt.id,
              poll.votesByOption,
              'totalVotes' in poll ? poll.totalVotes : 0,
            ),
          }))}
          loggedDID={authenticatedDID}
          authorDID={poll.node.author.id}
          publishedAt={`${new Date(poll.node.createdAt).toDateString()} - ${new Date(
            poll.node.createdAt,
          ).toLocaleTimeString()}`}
          totalVotes={'totalVotes' in poll ? poll.totalVotes : 0}
          votesByOption={poll.votesByOption}
        />
      ))}
    </Stack>
  );
};

export default PollPage;
