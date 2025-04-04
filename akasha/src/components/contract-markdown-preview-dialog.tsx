import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
        
        <div className="py-4 overflow-auto">
          <div className="text-white markdown-content">
            <ReactMarkdown components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
              h5: ({ node, ...props }) => <h5 className="text-sm font-bold mt-2 mb-1" {...props} />,
              h6: ({ node, ...props }) => <h6 className="text-xs font-bold mt-2 mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="my-3" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 hover:underline" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-500 pl-4 my-4 italic" {...props} />,
              code: ({ inline, className, children, ...props }: any) => 
                inline 
                  ? <code className="bg-gray-800 rounded px-1 py-0.5 text-sm text-orange-400" {...props}>{children}</code>
                  : <code className="block bg-gray-800 rounded p-0 text-sm" {...props}>{children}</code>,
              pre: ({ node, ...props }) => <pre className="bg-gray-800 rounded p-3 my-4 overflow-auto text-sm border border-gray-700" {...props} />,
              table: ({ node, ...props }) => <table className="border-collapse my-4 w-full" {...props} />,
              thead: ({ node, ...props }) => <thead className="bg-gray-800" {...props} />,
              th: ({ node, ...props }) => <th className="border border-gray-700 px-4 py-2 text-left" {...props} />,
              td: ({ node, ...props }) => <td className="border border-gray-700 px-4 py-2" {...props} />,
              hr: ({ node, ...props }) => <hr className="my-6 border-gray-700" {...props} />,
              img: ({ node, ...props }) => <img className="max-w-full h-auto my-4 rounded" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              del: ({ node, ...props }) => <del className="line-through" {...props} />,
            }}>
              {markdown}
            </ReactMarkdown>
          </div>
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