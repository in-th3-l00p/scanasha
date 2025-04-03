import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Stack } from '@/components/ui/stack';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Download, AlertTriangle, Check, FileJson, FileText } from 'lucide-react';

export interface ContractAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    contractName: string;
    address: string;
    description: string;
    status: string;
  };
  auditData?: {
    permissionData: string | null;
    auditMarkdown: string | null;
  };
  onGeneratePermissionData: () => void;
  onGenerateAuditMarkdown: () => void;
  isGeneratingPermissionData?: boolean;
  isGeneratingAuditMarkdown?: boolean;
}

export const ContractAuditDialog: React.FC<ContractAuditDialogProps> = ({
  open,
  onOpenChange,
  contract,
  auditData = { permissionData: null, auditMarkdown: null },
  onGeneratePermissionData,
  onGenerateAuditMarkdown,
  isGeneratingPermissionData = false,
  isGeneratingAuditMarkdown = false,
}) => {
  const hasPermissionData = !!auditData.permissionData;
  const hasAuditMarkdown = !!auditData.auditMarkdown;
  const isFullyAudited = hasPermissionData && hasAuditMarkdown;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Typography variant="h4">Audit Contract</Typography>
            <Typography variant="sm" className="font-mono">{contract.contractName}</Typography>
          </DialogTitle>
          <Typography variant="sm" className="text-muted-foreground mt-2">
            Run security analysis on this contract to identify potential vulnerabilities
          </Typography>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-6">
          {/* Permission Data Section */}
          <Card className="p-4 border border-border/50">
            <Stack direction="column" spacing={4}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <Typography variant="sm" bold>Permission Scanner Data</Typography>
                  {hasPermissionData ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                      <Check className="h-3 w-3 mr-1" /> Generated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!hasPermissionData}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button 
                    variant={hasPermissionData ? "outline" : "default"} 
                    size="sm"
                    onClick={onGeneratePermissionData}
                    disabled={isGeneratingPermissionData || hasPermissionData}
                    loading={isGeneratingPermissionData}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <Typography variant="xs" className="text-muted-foreground">
                Scans the contract for permissioned functions that might introduce risks or require special privileges
              </Typography>
            </Stack>
          </Card>

          {/* Audit Markdown Section */}
          <Card className="p-4 border border-border/50">
            <Stack direction="column" spacing={4}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <Typography variant="sm" bold>Audit Report</Typography>
                  {hasAuditMarkdown ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                      <Check className="h-3 w-3 mr-1" /> Generated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!hasAuditMarkdown}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  <Button 
                    variant={hasAuditMarkdown ? "outline" : "default"} 
                    size="sm"
                    onClick={onGenerateAuditMarkdown}
                    disabled={isGeneratingAuditMarkdown || hasAuditMarkdown || !hasPermissionData}
                    loading={isGeneratingAuditMarkdown}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              <Typography variant="xs" className="text-muted-foreground">
                AI-generated comprehensive audit report based on permission scanner data
              </Typography>
            </Stack>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center gap-2 mr-auto">
            <Typography variant="sm" bold>Audit Status:</Typography>
            {isFullyAudited ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                <Check className="h-3 w-3 mr-1" /> Fully Audited
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                <AlertTriangle className="h-3 w-3 mr-1" /> Pending Completion
              </Badge>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 