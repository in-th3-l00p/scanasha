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
  CreateContractResponse,
  ContractsResponse,
  CreateContractAuditResponse,
  ContractAuditsResponse,
  ContractAuditsByContractResponse,
  UpdateContractResponse,
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

export const createContract = async (
  contractName: string,
  description: string,
  address: string,
  authenticatedDID: string,
  permissionData?: string,
  auditMarkdown?: string,
  score?: number,
) => {
  console.log(authenticatedDID);
  const compose = getComposeClient();
  try {
    const content: any = {
      contractName,
      description,
      address,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Add optional fields if provided
    if (permissionData !== undefined) content.permissionData = permissionData;
    if (auditMarkdown !== undefined) content.auditMarkdown = auditMarkdown;
    if (score !== undefined) content.score = score;
    
    const res = await compose.executeQuery<CreateContractResponse>(
      `
      mutation CreateContract($input: CreateContractInput!) {
        createContract(input: $input) {
          document {
            id
            contractName
            description
            address
            createdAt
            status
            permissionData
            auditMarkdown
            score
            author {
              id
            }
          }
        }
      }
    `,
      {
        input: {
          content,
        },
      },
    );
    return res;
  } catch (err) {
    console.error('Error creating contract', err);
    return { error: err.message };
  }
};

export const getContracts = async () => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<ContractsResponse>(`
      query AllContracts {
        contractIndex(first: 100, sorting: { createdAt: DESC }) {
          edges {
            node {
              id
              contractName
              address
              description
              status
              createdAt
              permissionData
              auditMarkdown
              score
              author {
                id
              }
            }
          }
        }
      }
    `);
    return res;
  } catch (err) {
    console.error('Error fetching contracts', err);
    return { error: err.message };
  }
};

export const createContractAudit = async (
  contractID: string,
  permissionData: string,
  auditMarkdown: string,
  score: number,
  status = 'pending',
) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<CreateContractAuditResponse>(
      `
      mutation CreateContractAudit($input: CreateContractAuditInput!) {
        createContractAudit(input: $input) {
          document {
            id
            contractID
            permissionData
            auditMarkdown
            createdAt
            score
            status
            author {
              id
            }
          }
        }
      }
    `,
      {
        input: {
          content: {
            contractID,
            permissionData,
            auditMarkdown,
            createdAt: new Date().toISOString(),
            score,
            status,
          },
        },
      },
    );
    return res;
  } catch (err) {
    console.error('Error creating contract audit', err);
    return { error: err.message };
  }
};

export const updateContractAudit = async (
  id: string,
  auditMarkdown?: string,
  score?: number,
  status?: string,
) => {
  const compose = getComposeClient();
  try {
    // Build the update object dynamically based on what's provided
    const updateContent: {
      auditMarkdown?: string;
      score?: number;
      status?: string;
    } = {};
    
    if (auditMarkdown !== undefined) updateContent.auditMarkdown = auditMarkdown;
    if (score !== undefined) updateContent.score = score;
    if (status !== undefined) updateContent.status = status;
    
    const res = await compose.executeQuery(
      `
      mutation UpdateContractAudit($input: UpdateContractAuditInput!) {
        updateContractAudit(input: $input) {
          document {
            id
            contractID
            permissionData
            auditMarkdown
            createdAt
            score
            status
            author {
              id
            }
          }
        }
      }
    `,
      {
        input: {
          id,
          content: updateContent,
        },
      },
    );
    return res;
  } catch (err) {
    console.error('Error updating contract audit', err);
    return { error: err.message };
  }
};

export const getContractAudits = async () => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<ContractAuditsResponse>(`
      query AllContractAudits {
        contractAuditIndex(first: 100, sorting: { createdAt: DESC }) {
          edges {
            node {
              id
              contractID
              permissionData
              auditMarkdown
              createdAt
              score
              status
              author {
                id
              }
            }
          }
        }
      }
    `);
    return res;
  } catch (err) {
    console.error('Error fetching contract audits', err);
    return { error: err.message };
  }
};

export const getContractAuditById = async (auditId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      query ContractAuditById($auditId: ID!) {
        node(id: $auditId) {
          ... on ContractAudit {
            id
            contractID
            permissionData
            auditMarkdown
            createdAt
            score
            status
            author {
              id
            }
          }
        }
      }
    `,
      { auditId },
    );
    return res;
  } catch (err) {
    console.error('Error fetching contract audit by id', err);
    return { error: err.message };
  }
};

export const getContractAuditsByContractId = async (contractId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<{data: ContractAuditsByContractResponse}>(
      `
      query AuditsByContractId {
        contractAuditIndex(
          first: 100
          filters: { where: { contractID: { equalTo: "${contractId}" } } }
          sorting: { createdAt: DESC }
        ) {
          edges {
            node {
              id
              contractID
              permissionData
              auditMarkdown
              createdAt
              score
              status
              author {
                id
              }
            }
          }
        }
      }
    `);
    return res;
  } catch (err) {
    console.error('Error fetching audits by contract id', err);
    return { error: err.message };
  }
};

export const getContractAuditsByAuthorId = async (authorId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      query AuditsByAuthor($authorId: ID!) {
        node(id: $authorId) {
          ... on CeramicAccount {
            contractAuditList(last: 100, sorting: { createdAt: DESC }) {
              edges {
                node {
                  id
                  contractID
                  permissionData
                  auditMarkdown
                  createdAt
                  score
                  status
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
    console.error('Error fetching audits by author', err);
    return { error: err.message };
  }
};

export const getContractWithLatestAudit = async (contractId: string) => {
  const compose = getComposeClient();
  try {
    // First get the contract details
    const contractRes = await compose.executeQuery(
      `
      query ContractById($contractId: ID!) {
        node(id: $contractId) {
          ... on Contract {
            id
            contractName
            description
            address
            createdAt
            status
            permissionData
            auditMarkdown
            score
            author {
              id
            }
          }
        }
      }
    `,
      { contractId },
    );
    
    // Then get the latest audit for this contract
    const auditRes = await compose.executeQuery(`
      query AuditsByContractId {
        contractAuditIndex(
          first: 100
          filters: { where: { contractID: { equalTo: "${contractId}" } } }
          sorting: { createdAt: DESC }
        ) {
          edges {
            node {
              id
              contractID
              permissionData
              auditMarkdown
              createdAt
              score
              status
              author {
                id
              }
            }
          }
        }
      }
    `);
    
    // If there are any audits, get the most recent one (should be first in DESC order)
    let latestAudit = null;
    if (auditRes?.data?.contractAuditIndex?.edges?.length > 0) {
      latestAudit = auditRes.data.contractAuditIndex.edges[0].node;
    }
    
    return {
      data: {
        contract: contractRes.data?.node,
        latestAudit,
      },
    };
  } catch (err) {
    console.error('Error fetching contract with latest audit', err);
    return { error: err.message };
  }
};

export const updateContract = async (
  id: string,
  content: {
    contractName?: string;
    description?: string;
    address?: string;
    status?: string;
    permissionData?: string;
    auditMarkdown?: string;
    score?: number;
  }
) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery<UpdateContractResponse>(
      `
      mutation UpdateContract($input: UpdateContractInput!) {
        updateContract(input: $input) {
          document {
            id
            contractName
            description
            address
            createdAt
            status
            permissionData
            auditMarkdown
            score
            author {
              id
            }
          }
        }
      }
    `,
      {
        input: {
          id,
          content,
        },
      }
    );
    return res;
  } catch (err) {
    console.error('Error updating contract', err);
    return { error: err.message };
  }
};

export const deleteContract = async (id: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      mutation DeleteContract($input: DeleteContractInput!) {
        deleteContract(input: $input) {
          document {
            id
          }
        }
      }
    `,
      {
        input: {
          id,
        },
      }
    );
    return res;
  } catch (err) {
    console.error('Error deleting contract', err);
    return { error: err.message };
  }
};

export const getContractById = async (contractId: string) => {
  const compose = getComposeClient();
  try {
    const res = await compose.executeQuery(
      `
      query ContractById($contractId: ID!) {
        node(id: $contractId) {
          ... on Contract {
            id
            contractName
            description
            address
            createdAt
            status
            permissionData
            auditMarkdown
            score
            author {
              id
            }
          }
        }
      }
    `,
      { contractId }
    );
    return res;
  } catch (err) {
    console.error('Error fetching contract by id', err);
    return { error: err.message };
  }
};

export const scanContract = async (contractName: string, contractAddress: string): Promise<
  { data: any; error?: never } | { data?: never; error: string }
> => {
  try {
    const response = await fetch('https://localhost/api/permissions/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_name: contractName,
        contract_address: contractAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error scanning contract:', error);
    return { error: error.message };
  }
};

export const generateAuditReport = async (scannerData: string): Promise<
  { data: { auditMarkdown: string }; error?: never } | { data?: never; error: string }
> => {
  try {
    const response = await fetch('https://localhost/api/audit/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scannerData: JSON.parse(scannerData)
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('API returned unsuccessful response');
    }
    
    return { data: data.data };
  } catch (error) {
    console.error('Error generating audit report:', error);
    return { error: error.message };
  }
};
