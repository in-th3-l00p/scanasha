import { ContentCard, ContentCardBody } from '@/components/ui/content-card';
import { Typography } from '@/components/ui/typography';
import { useGetProfileByDidQuery } from '@akashaorg/ui-core-hooks/lib/generated';
import { selectProfileData } from '@akashaorg/ui-core-hooks/lib/selectors/get-profile-by-did-query';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ContractAuditDialog } from '../contract-audit-dialog';

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
  const [isGeneratingPermissionData, setIsGeneratingPermissionData] = useState(false);
  const [isGeneratingAuditMarkdown, setIsGeneratingAuditMarkdown] = useState(false);
  const [auditData, setAuditData] = useState<{
    permissionData: string | null;
    auditMarkdown: string | null;
  }>({
    permissionData: null,
    auditMarkdown: null,
  });

  const author = useMemo(() => {
    if (profileDataRes.data) {
      return selectProfileData(profileDataRes.data);
    }
    return undefined;
  }, [profileDataRes]);

  const handleGeneratePermissionData = async () => {
    setIsGeneratingPermissionData(true);
    try {
      // Here you would call your API to generate permission data
      // const response = await yourApi.generatePermissionData(contractId);
      // For now, let's simulate a response after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data
      const mockPermissionData = JSON.stringify({
        functions: [
          { name: "transferOwnership", permissionLevel: "owner", risk: "high" },
          { name: "withdraw", permissionLevel: "owner", risk: "high" },
          { name: "pause", permissionLevel: "admin", risk: "medium" }
        ],
        riskScore: 75
      }, null, 2);
      
      setAuditData(prev => ({
        ...prev,
        permissionData: mockPermissionData
      }));
    } catch (error) {
      console.error("Error generating permission data:", error);
    } finally {
      setIsGeneratingPermissionData(false);
    }
  };

  const handleGenerateAuditMarkdown = async () => {
    setIsGeneratingAuditMarkdown(true);
    try {
      // Here you would call your API to generate the audit markdown
      // const response = await yourApi.generateAuditMarkdown(contractId, auditData.permissionData);
      // For now, let's simulate a response after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock markdown data
      const mockMarkdown = `# Security Audit for ${contractName}
      
## Overview
Address: \`${address}\`
Risk Score: **75/100** (High Risk)

## Critical Functions
The contract has several high-risk permissioned functions:

1. **transferOwnership** - Owner only
   - Allows changing the contract owner
   - High risk if compromised

2. **withdraw** - Owner only
   - Allows withdrawing all funds from the contract
   - High risk of rugpull if owner keys are compromised

3. **pause** - Admin only
   - Allows pausing all contract functionality
   - Medium risk, can affect availability

## Recommendations
- Implement time locks for ownership transfer
- Add multi-sig requirements for withdrawals
- Consider a DAO-based governance model
`;
      
      setAuditData(prev => ({
        ...prev,
        auditMarkdown: mockMarkdown
      }));
    } catch (error) {
      console.error("Error generating audit markdown:", error);
    } finally {
      setIsGeneratingAuditMarkdown(false);
    }
  };

  return (
    <>
      <ContentCard
        author={{ did: author?.did.id || '', name: author?.name || 'Unknown' }}
        publishedAt={publishedAt}
      >
        <ContentCardBody className="flex flex-col gap-4">
          <div className="flex flex-row justify-between items-center">
            <Typography variant="sm" bold>
              {contractName}
            </Typography>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAuditDialogOpen(true)}
              >
                Audit
              </Button>
              <Button variant="outline" size="sm">
                Edit
              </Button>
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
    </>
  );
};

export { ContractCard }; 