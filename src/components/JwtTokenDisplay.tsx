
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface JwtTokenDisplayProps {
  token: string;
  className?: string;
}

export default function JwtTokenDisplay({ token, className }: JwtTokenDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Split token into parts
  const parts = token ? token.split('.') : ['', '', ''];
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "JWT token has been copied to clipboard",
      duration: 2000,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative font-mono text-sm break-all rounded-md p-4 bg-muted", className)}>
      <button 
        onClick={copyToClipboard}
        className="absolute right-2 top-2 p-1 rounded-md hover:bg-accent transition-colors"
        aria-label="Copy token"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
      
      <span className="text-jwt-header dark:text-jwt-header-dark font-medium">{parts[0]}</span>.
      <span className="text-jwt-payload dark:text-jwt-payload-dark font-medium">{parts[1]}</span>.
      <span className="text-jwt-signature dark:text-jwt-signature-dark font-medium">{parts[2]}</span>
    </div>
  );
}
