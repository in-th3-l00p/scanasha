import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Stack } from '@/components/ui/stack';
import { useNavigate } from '@tanstack/react-router';
import { FeedCTA } from '@/components/ui/feed-cta';
import { useAkashaStore, useRootComponentProps } from '@akashaorg/ui-core-hooks';
import { useCallback, useEffect, useState } from 'react';
import { getContracts } from '@/api';
import { Contract, isContractsResponse, isErrorResponse } from '@/api/types';
import { ContractCard } from './contract-card';

const ContractsListPage = () => {
  const {
    data: { authenticatedDID },
  } = useAkashaStore();

  const { navigateToModal } = useRootComponentProps();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState<string | null>(null);

  console.log(contracts);

  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true);
      const res = await getContracts();
      setIsLoading(false);
      
      if (isErrorResponse(res)) {
        setError(res.error);
        return;
      }
      
      if (isContractsResponse(res) && res.data?.contractIndex?.edges) {
        setContracts(res.data.contractIndex.edges.map(edge => edge.node));
      }
    };
    
    fetchContracts();
  }, []);

  const handleCreateContractClick = useCallback(() => {
    if (!authenticatedDID) {
      alert('Please login to create a contract');
      navigateToModal({
        name: 'login',
        redrectTo: location.pathname,
      });
      return;
    }
    
    navigate({
      to: '/add-contract',
    });
  }, [authenticatedDID, navigateToModal, navigate]);

  return (
    <Stack spacing={4}>
      <FeedCTA
        avatarSrc="https://github.com/akashaorg.png"
        profileDID={authenticatedDID}
        cta="Start a smart contract to ensure its security and reliability!"
      >
        <Button size="sm" onClick={handleCreateContractClick}>
          Add Contract
        </Button>
      </FeedCTA>
      
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <Typography variant="sm" bold>
              Loading contracts...
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <Typography variant="sm" bold>
              Error loading contracts: {error}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && contracts.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <Typography variant="h4" className="mb-4">
              Smart Contracts
            </Typography>
            
            <Typography variant="sm">
              No contracts found. Start by creating a contract!
            </Typography>
          </CardContent>
        </Card>
      )}

      {contracts.map(contract => (
        <ContractCard
          key={contract.id}
          contractId={contract.id}
          contractName={contract.contractName}
          description={contract.description}
          address={contract.address}
          status={contract.status as 'pending' | 'in_progress' | 'completed'}
          authorDID={contract.author.id}
          publishedAt={`${new Date(contract.createdAt).toDateString()} - ${new Date(
            contract.createdAt
          ).toLocaleTimeString()}`}
          metrics={JSON.parse(contract.metricsData || '{}')}
          autonomyMetric={contract.autonomyMetric}
          exitwindowMetric={contract.exitwindowMetric}
          chainMetric={contract.chainMetric}
          upgradeabilityMetric={contract.upgradeabilityMetric}
        />
      ))}
    </Stack>
  );
};

export default ContractsListPage; 