import { ContentCard, ContentCardBody } from '@/components/ui/content-card';
import { Typography } from '@/components/ui/typography';
import { useGetProfileByDidQuery } from '@akashaorg/ui-core-hooks/lib/generated';
import { selectProfileData } from '@akashaorg/ui-core-hooks/lib/selectors/get-profile-by-did-query';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ContractAuditDialog } from '../contract-audit-dialog';
import { ContractEditDialog } from '../contract-edit-dialog';
import { useAkashaStore } from '@akashaorg/ui-core-hooks';
import { getContractById } from '@/api';
import { Contract, isErrorResponse } from '@/api/types';
import { scanContract, updateContract, generateAuditReport } from '@/api';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
  completed: 'bg-green-500/10 text-green-500 border-green-500/50',
};

const ContractCard = ({
  contractId,
  contractName,
  description,
  address,
  status,
  authorDID,
  publishedAt,
}: Omit<
  React.ComponentProps<typeof ContentCard> & {
    contractId: string;
    contractName: string;
    description: string;
    address: string;
    status: 'pending' | 'in_progress' | 'completed';
    authorDID: string;
  },
  'author'
>) => {
  const profileDataRes = useGetProfileByDidQuery({ variables: { id: authorDID } });
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isGeneratingPermissionData, setIsGeneratingPermissionData] = useState(false);
  const [isGeneratingAuditMarkdown, setIsGeneratingAuditMarkdown] = useState(false);
  const [contractDetails, setContractDetails] = useState<Contract | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [auditData, setAuditData] = useState<{
    permissionData: string | null;
    auditMarkdown: string | null;
  }>({
    permissionData: null,
    auditMarkdown: null,
  });

  const {
    data: { authenticatedDID },
  } = useAkashaStore();

  const author = useMemo(() => {
    if (profileDataRes.data) {
      return selectProfileData(profileDataRes.data);
    }
    return undefined;
  }, [profileDataRes]);

  const isAuthor = useMemo(() => {
    return authenticatedDID === authorDID;
  }, [authenticatedDID, authorDID]);

  const handleGeneratePermissionData = async () => {
    setIsGeneratingPermissionData(true);
    try {
      // Call the scanContract API function with the contract info
      const result = await scanContract(contractName, address);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // At this point, we know result has data
      // Format the response data as JSON
      const permissionData = JSON.stringify((result as { data: any }).data, null, 2);
      
      // Update state with the received permission data
      setAuditData(prev => ({
        ...prev,
        permissionData
      }));
      
      // Update the contract with the permission data
      if (contractId) {
        await updateContract(contractId, {
          permissionData
        });
      }
    } catch (error) {
      console.error("Error generating permission data:", error);
    } finally {
      setIsGeneratingPermissionData(false);
    }
  };

  const handleGenerateAuditMarkdown = async () => {
    setIsGeneratingAuditMarkdown(true);
    try {
      if (!auditData.permissionData) {
        throw new Error("Permission data must be generated first");
      }
      
      // Call the audit report generation API
      const result = await generateAuditReport(auditData.permissionData);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // At this point, we know result has data with auditMarkdown and potentially metrics
      const { auditMarkdown, riskScore, metrics } = result.data;
      
      // Update state with the received audit markdown
      setAuditData(prev => ({
        ...prev,
        auditMarkdown
      }));
      
      // Create metrics JSON string if metrics are provided
      const metricsData = metrics ? JSON.stringify(metrics) : undefined;
      
      // Update the contract with the audit markdown and metrics
      if (contractId) {
        await updateContract(contractId, {
          auditMarkdown,
          score: riskScore,
          autonomyMetric: metrics?.autonomy,
          exitwindowMetric: metrics?.exitwindow,
          chainMetric: metrics?.chain,
          upgradeabilityMetric: metrics?.upgradeability,
          metricsData
        });
      }
    } catch (error) {
      console.error("Error generating audit markdown:", error);
    } finally {
      setIsGeneratingAuditMarkdown(false);
    }
  };

  const handleEditClick = async () => {
    setIsLoadingContract(true);
    try {
      const response = await getContractById(contractId);
      
      // Check if the response contains an error
      if (isErrorResponse(response)) {
        throw new Error(response.error);
      }
      
      if (response.data?.node) {
        const contract = response.data.node as Contract;
        setContractDetails(contract);
        
        // Update auditData state with data from the contract
        setAuditData({
          permissionData: contract.permissionData || null,
          auditMarkdown: contract.auditMarkdown || null
        });
        
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
    } finally {
      setIsLoadingContract(false);
    }
  };

  const handleAuditClick = async () => {
    setIsLoadingContract(true);
    try {
      const response = await getContractById(contractId);
      console.log(response);
      // Check if the response contains an error
      if (isErrorResponse(response)) {
        throw new Error(response.error);
      }
      
      if (response.data?.node) {
        const contract = response.data.node as Contract;
        
        // Update auditData state with data from the contract
        setAuditData({
          permissionData: contract.permissionData || null,
          auditMarkdown: contract.auditMarkdown || null
        });
        
        setAuditDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching contract details:", error);
    } finally {
      setIsLoadingContract(false);
    }
  };

  const handleEditSuccess = () => {
    // You could refresh the data here or implement a callback to the parent component
    window.location.reload(); // Simple refresh for now
  };

  return (
    <>
      <ContentCard
        author={{ did: author?.did.id || '', name: author?.name || 'Unknown' }}
        publishedAt={publishedAt}
      >
        <ContentCardBody className="flex flex-col gap-4">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <Typography variant="sm" bold>
                {contractName}
              </Typography>
              <Badge variant="outline" className={statusColors[status]}>
                {status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAuditClick}
                disabled={isLoadingContract}
              >
                {isLoadingContract ? 'Loading...' : 'Audit'}
              </Button>
              {isAuthor && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditClick}
                  disabled={isLoadingContract}
                >
                  {isLoadingContract ? 'Loading...' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
          
          <Typography variant="sm">{description}</Typography>
          
          <div className="bg-muted/20 rounded-md p-3 mt-2 flex flex-col items-center gap-2">
            <Typography variant="xs" className="text-muted-foreground">
              Contract Address
            </Typography>
            <Typography variant="sm" className="font-mono break-all">
              {address}
            </Typography>
          </div>
        </ContentCardBody>
      </ContentCard>

      <ContractAuditDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
        contract={{
          id: contractId,
          contractName,
          address,
          description,
          status,
        }}
        auditData={auditData}
        onGeneratePermissionData={handleGeneratePermissionData}
        onGenerateAuditMarkdown={handleGenerateAuditMarkdown}
        isGeneratingPermissionData={isGeneratingPermissionData}
        isGeneratingAuditMarkdown={isGeneratingAuditMarkdown}
      />

      {contractDetails && (
        <ContractEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          contract={contractDetails}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export { ContractCard }; 