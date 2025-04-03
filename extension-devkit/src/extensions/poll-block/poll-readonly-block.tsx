import React, { useEffect, useMemo, useState } from 'react';
import { BlockInstanceMethods, ContentBlockRootProps } from '@akashaorg/typings/lib/ui';
import { useAkashaStore } from '@akashaorg/ui-core-hooks';
import { createVote, getPollById, hasSession } from '../../api';
import { getOptionPercentage } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Option } from '@/components/poll-card/poll-option';
import { Vote } from '@/api/types';

type PollResponse = Awaited<ReturnType<typeof getPollById>>;

export const PollReadonlyBlock = (
  props: ContentBlockRootProps & { blockRef?: React.RefObject<BlockInstanceMethods> },
) => {
  const { content } = props;

  const valueString = content.value;
  const value = JSON.parse(valueString);
  const pollId = value.pollId;

  const [response, setResponse] = useState<PollResponse | null>(null);
  const [pollSelections, setPollSelections] = useState<Vote[]>([]);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;
      const poll = await getPollById(pollId);
      setResponse(poll);
    };
    fetchPoll();
  }, [pollId]);

  const {
    data: { authenticatedDID, isAuthenticating },
  } = useAkashaStore();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authenticatedDID && !isAuthenticating) {
        const authorized = await hasSession();
        setIsAuthorized(authorized);
      }
    };
    checkAuthorization();
  }, [authenticatedDID, isAuthenticating]);

  useEffect(() => {
    if (!authenticatedDID || !response?.data || !response?.data?.votes) return;
    if (!response?.data.poll) return;

    setPollSelections(
      response.data.votes.filter(
        vote => vote.voter.id === authenticatedDID && vote.pollID === response.data?.poll.id,
      ),
    );
  }, [response?.data, authenticatedDID]);

  const votePercentages = useMemo(() => {
    if (!response?.data) return {};
    if (!response.data.votesByOption || !pollSelections.length) return {};
    const { votesByOption, totalVotes } = response.data;
    if (pollSelections.some(vote => vote.id?.startsWith('temp-id_'))) {
      // we have at least one temp vote
      return votesByOption.reduce((acc, vote) => {
        const optionId = vote.option.id;
        const totalV = totalVotes + pollSelections.filter(v => v.id?.startsWith('temp-id_')).length;
        const voteCount =
          vote.votesCount +
          pollSelections.filter(v => v.optionID === optionId && v.id?.startsWith('temp-id_'))
            .length;
        const percentage = (voteCount / totalV) * 100;
        acc[optionId] = Math.round(percentage);
        return acc;
      }, {});
    }
    // initial votes
    return votesByOption.reduce((acc, vote) => {
      const optionId = vote.option.id;
      const percentage = getOptionPercentage(optionId, votesByOption, totalVotes);
      acc[optionId] = percentage;
      return acc;
    }, {});
  }, [response?.data, pollSelections]);

  if (!response?.data) {
    return <div>Loading poll...</div>;
  }

  if (response.error) {
    return <div>Error loading poll: {response.error}</div>;
  }

  if (!response?.data.poll) {
    return <div>Poll not found</div>;
  }

  const onVote = (optionId: string) => () => {
    setPollSelections(prev =>
      prev.concat({
        createdAt: new Date().toISOString(),
        id: `temp-id_${optionId}`,
        optionID: optionId,
        pollID: pollId,
        voter: { id: authenticatedDID },
        isValid: true,
      }),
    );
    createVote(pollId, optionId, true);
  };

  return (
    <Card className="border-0 px-0 py-4">
      <CardHeader>
        <Typography variant="h5">{response.data.poll.title}</Typography>
        <Typography variant="p">{response.data.poll.description}</Typography>
      </CardHeader>
      <CardContent>
        {response.data.poll.options.map(option => (
          <Option
            key={option.id}
            value={option.name}
            percentage={votePercentages[option.id] ?? 0}
            selected={pollSelections.some(vote => vote.optionID === option.id)}
            onSelected={onVote(option.id)}
            canVote={isAuthorized}
          />
        ))}
        <Typography variant="xs" className="text-muted-foreground">
          {response.data?.totalVotes +
            pollSelections.filter(v => v.id?.startsWith('temp-id_')).length}{' '}
          votes
        </Typography>
      </CardContent>
    </Card>
  );
};
