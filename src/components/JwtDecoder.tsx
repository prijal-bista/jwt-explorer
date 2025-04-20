import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DecodedJwt, decodeJwt, formatTimestamp, isExpired, verifyJwtSignature } from '@/utils/jwt-utils';
import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import JwtTokenDisplay from './JwtTokenDisplay';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function JwtDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; error?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  
  useEffect(() => {
    if (token.trim()) {
      try {
        const result = decodeJwt(token);
        setDecoded(result);
        setVerificationResult(null);
      } catch (error) {
        setDecoded(null);
      }
    } else {
      setDecoded(null);
      setVerificationResult(null);
    }
  }, [token]);

  const handleVerifySignature = async () => {
    if (!token || !secretKey) return;
    
    setVerifying(true);
    try {
      const result = await verifyJwtSignature(token, secretKey);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ 
        verified: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    } finally {
      setVerifying(false);
    }
  };

  const renderTimestamp = (label: string, timestamp?: number) => {
    if (!timestamp) return null;
    
    const formattedDate = formatTimestamp(timestamp);
    const expired = isExpired(timestamp);
    
    return (
      <div className="flex items-start gap-2 mt-1">
        <span className="font-semibold min-w-24">{label}:</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center gap-1 ${expired ? 'text-destructive' : 'text-green-600'}`}>
                <Clock size={16} />
                {Math.floor(timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-80">
              <p className="font-mono text-sm">{formattedDate}</p>
              {expired && <p className="text-destructive text-xs mt-1">Expired</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>JWT Decoder</CardTitle>
        <CardDescription>
          Paste your JWT token to decode and inspect its contents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your JWT token..."
          className="font-mono min-h-20 mb-4"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        
        {token && !decoded?.isValid && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {decoded?.error || 'Invalid JWT format. Please check your token.'}
            </AlertDescription>
          </Alert>
        )}

        {token && decoded?.isValid && (
          <div className="space-y-4">
            <JwtTokenDisplay token={token} />
            
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-2">Verify Signature</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <div className="flex mt-1 gap-2">
                    <Input
                      id="secretKey"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter the secret key used to sign this token"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifySignature} 
                      disabled={!secretKey || verifying}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
                
                {verificationResult && (
                  <Alert variant={verificationResult.verified ? "default" : "destructive"} className="mt-2">
                    <div className="flex items-center gap-2">
                      {verificationResult.verified ? (
                        <>
                          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Signature verified successfully</span>
                        </>
                      ) : (
                        <>
                          <ShieldX className="h-4 w-4" />
                          <span className="font-medium">Signature verification failed</span>
                        </>
                      )}
                    </div>
                    {!verificationResult.verified && verificationResult.error && (
                      <AlertDescription className="mt-2">
                        {verificationResult.error}
                      </AlertDescription>
                    )}
                  </Alert>
                )}
              </div>
            </div>
            
            <Accordion type="multiple" defaultValue={['header', 'payload', 'signature']}>
              <AccordionItem value="header" className="border-jwt-header/30 dark:border-jwt-header-dark/30">
                <AccordionTrigger className="text-jwt-header dark:text-jwt-header-dark font-medium">
                  Header
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                    {formatJson(decoded.header)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="payload" className="border-jwt-payload/30 dark:border-jwt-payload-dark/30">
                <AccordionTrigger className="text-jwt-payload dark:text-jwt-payload-dark font-medium">
                  Payload
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {renderTimestamp('Expires at', decoded.payload.exp)}
                    {renderTimestamp('Issued at', decoded.payload.iat)}
                    {renderTimestamp('Not before', decoded.payload.nbf)}
                    
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto mt-3">
                      {formatJson(decoded.payload)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="signature" className="border-jwt-signature/30 dark:border-jwt-signature-dark/30">
                <AccordionTrigger className="text-jwt-signature dark:text-jwt-signature-dark font-medium">
                  Signature
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                    {decoded.signature}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    The signature is used to verify that the sender of the JWT is who it says it is and to ensure the message wasn't changed along the way.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
