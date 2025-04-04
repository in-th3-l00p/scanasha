import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ContractMarkdownPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markdown: string;
  contractName: string;
}

export const ContractMarkdownPreviewDialog: React.FC<ContractMarkdownPreviewDialogProps> = ({
  open,
  onOpenChange,
  markdown,
  contractName,
}) => {
  const handleDownload = () => {
    // Create a blob with the markdown content
    const blob = new Blob([markdown], { type: 'text/markdown' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractName}_audit_report.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            <Typography variant="h4">Audit Report</Typography>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 overflow-auto prose dark:prose-invert">
          {/* 
            Render markdown content. Since we don't have a specific markdown library installed,
            we'll use a pre-formatted element for now. In a real app, you'd use a markdown renderer
            like react-markdown or remark/rehype.
          */}
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/20 p-4 rounded-md overflow-auto">
            {markdown}
          </pre>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Markdown
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 