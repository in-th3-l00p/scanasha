import { ComposeClient } from '@composedb/client';
import { definition } from './__generated__/definition';
import getSDK from '@akashaorg/core-sdk';
import {
  CreatePollResponse,
  Poll,
  PollOption,
  PollsResponse,
  Vote,
  VotesByVoterResponse,
  VotesResponse,
} from './types';

let composeClient: ComposeClient;

export const getComposeClient = () => {
  if (!composeClient) {
    composeClient = new ComposeClient({
      ceramic: 'http://localhost:7007',
      definition,
    });
  }
  return composeClient;
};

export const hasSession = async (): Promise<boolean> => {
  const sdk = getSDK();
  const composeClient = getComposeClient();

  if (!composeClient) {
    return false;
  }
  const hasSession = await sdk.services.ceramic.hasSession();

  if (hasSession) {
    const sessDID = sdk.services.ceramic.getComposeClient().did;
    if (sessDID && sessDID !== composeClient.did) {
      composeClient.setDID(sessDID);
    }
  }
  return hasSession;
};

export const createPoll = async (
  title: string,
  description: string,
  options: { id: string; name: string }[],
) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<CreatePollResponse>(
      `
      mutation CreatePoll($input: CreatePollInput!) {
        createPoll(input: $input) {
          document {
            id
            title
            createdAt
            description
            options {
              id
              name
            }
          }
        }
      }
    `,
      {
        input: {
          content: {
            title,
            description,
            createdAt: new Date().toISOString(),
            options,
          },
        },
      },
    );
    return res;
  } catch (err) {
    console.error('Error creating poll', err);
    return { error: err.message };
  }
};

console.log('createPoll', createPoll);

export const createVote = async (pollId: string, optionID: string, isValid = true) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      mutation CreateVote($input: CreateVoteInput!) {
        createVote(input: $input) {
          document {
            pollID
            optionID
            isValid
            createdAt
          }
        }
      }
    `,
      {
        input: {
          content: {
            pollID: pollId,
            optionID,
            isValid,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );
    return res;
  } catch (err) {
    console.error('Error creating vote', err);
    return { error: err.message };
  }
};

export const getPolls = async () => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<PollsResponse>(`
      query AllPolls {
        pollIndex(first: 100, sorting: { createdAt: DESC }) {
          edges {
            node {
              id
              title
              author {
                id
              }
              description
              createdAt
              options {
                id
                name
              }
            }
          }
        }
      }
    `);
    return res;
  } catch (err) {
    console.error('Error fetching polls', err);
    return { error: err.message };
  }
};

export const getPollById = async (pollId: string): Promise<{
  data?: {
    poll: Poll;
    votes: Vote[];
    votesByOption: {
      option: PollOption;
      votesCount: number;
      votes: Vote[];
    }[];
    totalVotes: number;
  };
  error?: string;
}> => {
  const compose = getComposeClient();
  try {
    const pollRes = await compose.executeQuery(
      `
      query PollById($pollId: ID!) {
        node(id: $pollId) {
          ... on Poll {
            id
            title
            description
            createdAt
            author {
              id
            }
            options {
              id
              name
            }
          }
        }
      }
    `,
      { pollId },
    );

    const votesResult = await getVotesByPollId(pollId);
    const poll = pollRes.data?.node as Poll;

    if (!votesResult || 'error' in votesResult) {
      return { data: { poll, votes: [], votesByOption: [], totalVotes: 0 }, error: votesResult.error };
    }

    const votes = votesResult.data?.voteIndex.edges
      ? votesResult.data.voteIndex.edges.map(edge => edge.node)
      : [];

    const votesByOption = poll?.options.map(option => {
      const optionVotes = votes.filter(vote => vote.optionID === option.id);
      return {
        option,
        votesCount: optionVotes.length,
        votes: optionVotes,
      };
    });

    return {
      data: {
        poll, votes, votesByOption, totalVotes: votes.length,
      },
    };
  } catch (err) {
    console.error('Error fetching poll by id', err);
    return { error: err.message };
  }
};

export const getAllPollsWithVotes = async () => {
  try {
    const pollRes = await getPolls();
    if (!pollRes || 'error' in pollRes) {
      return { error: pollRes.error };
    }
    if (!pollRes.data || !pollRes.data['pollIndex']) {
      return { error: 'No data found' };
    }
    const polls = pollRes.data.pollIndex.edges;

    const votes = polls.map(poll => {
      return getVotesByPollId(poll.node.id);
    });

    const votesRes = await Promise.all(votes);

    const pollsWithVotes = polls.map((poll, idx) => {
      const votesResult = votesRes[idx];
      if (!votesResult || 'error' in votesResult) {
        return { ...poll, votes: [], votesByOption: [], error: votesResult.error };
      }
      const votes = votesResult.data?.voteIndex.edges
        ? votesResult.data.voteIndex.edges.map(edge => edge.node)
        : [];

      // group votes by their respective option
      const votesByOption = poll.node.options.map(option => {
        const optionVotes = votes.filter(vote => vote.optionID === option.id);
        return {
          option,
          votesCount: optionVotes.length,
          votes: optionVotes,
        };
      });
      return {
        ...poll,
        votes,
        votesByOption,
        totalVotes: votes.length,
      };
    });
    return {
      data: {
        pollsWithVotes,
      },
    };
  } catch (err) {
    console.error('Error fetching polls with votes', err);
    return { error: err.message };
  }
};

export const getPollsByAuthorId = async (authorId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      query PollsByAuthor($authorId: ID!) {
        node(id: $authorId) {
          ... on CeramicAccount {
            pollList(last: 100, sorting: { createdAt: DESC }) {
              edges {
                node {
                  id
                  title
                  description
                  createdAt
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `,
      { authorId },
    );
    return res;
  } catch (err) {
    console.error('Error fetching polls by author', err);
    return { error: err.message };
  }
};

export const getVotesByVoterId = async (voterId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<VotesByVoterResponse>(
      `
      query VotesByVoter($voterId: ID!) {
        node(id: $voterId) {
          ...on CeramicAccount {
            voteList(last: 100, sorting: { createdAt: DESC }) {
              edges {
                node {
                  id
                  createdAt
                  pollID
                  optionID
                  voter {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `,
      { voterId },
    );
    return res;
  } catch (err) {
    console.error('Error fetching votes by voter id', err);
    return { error: err.message };
  }
};

export const getVotesByPollId = async (pollId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<VotesResponse>(`
      query VotesByPollId {
        voteIndex(
          first: 100
          filters: { where: { pollID: { equalTo: "${pollId}" } } }
          sorting: { createdAt: DESC }
        ) {
          edges {
            node {
              pollID
              optionID
              isValid
              createdAt
              voter {
                id
              }
            }
          }
        }
      }
    `);
    return res;
  } catch (err) {
    console.error('Error fetching votes by poll id', err);
    return { error: err.message };
  }
};
