
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { generateJwt } from "@/utils/jwt-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import JwtTokenDisplay from "./JwtTokenDisplay";

// Form schema
const formSchema = z.object({
  secretKey: z.string().min(1, "Secret key is required"),
  expiresIn: z.string().optional(),
  algorithm: z.string().default("HS256"),
  customPayload: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Custom claim item
interface CustomClaim {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "object";
}

export default function JwtGenerator() {
  const [token, setToken] = useState("");
  const [claims, setClaims] = useState<CustomClaim[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      secretKey: "",
      expiresIn: "1h",
      algorithm: "HS256",
      customPayload: "",
    },
  });

  const addClaim = () => {
    setClaims([...claims, { key: "", value: "", type: "string" }]);
  };

  const removeClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const updateClaim = (index: number, field: keyof CustomClaim, value: string) => {
    const newClaims = [...claims];
    (newClaims[index][field] as string) = value;
    setClaims(newClaims);
  };

  const generateToken = async (values: FormValues) => {
    setIsGenerating(true);
    try {
      // Build payload from claims or custom JSON
      let payload: Record<string, any> = {};
      
      if (values.customPayload && values.customPayload.trim()) {
        try {
          payload = JSON.parse(values.customPayload);
        } catch (error) {
          throw new Error("Invalid JSON in custom payload");
        }
      } else {
        // Build from individual claims
        claims.forEach((claim) => {
          if (claim.key.trim()) {
            let parsedValue: any = claim.value;
            
            // Parse based on type
            if (claim.type === "number") {
              parsedValue = Number(claim.value);
            } else if (claim.type === "boolean") {
              parsedValue = claim.value.toLowerCase() === "true";
            } else if (claim.type === "object") {
              try {
                parsedValue = JSON.parse(claim.value);
              } catch {
                throw new Error(`Invalid JSON for claim: ${claim.key}`);
              }
            }
            
            payload[claim.key] = parsedValue;
          }
        });
      }
      
      // JWT options
      const options: any = {};
      if (values.algorithm) options.algorithm = values.algorithm;
      if (values.expiresIn) options.expiresIn = values.expiresIn;
      
      // Generate token
      const newToken = await generateJwt(payload, values.secretKey, options);
      setToken(newToken);
      
      toast({
        title: "Token generated",
        description: "Your JWT token has been successfully created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate token",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>JWT Generator</CardTitle>
        <CardDescription>
          Create custom JWT tokens for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(generateToken)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input placeholder="your-secret-key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires In</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="1h" {...field} />
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Example: 1h, 2d, 30m, 10s
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="algorithm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Algorithm</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="HS256">HS256</option>
                        <option value="HS384">HS384</option>
                        <option value="HS512">HS512</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Tabs defaultValue="claims" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="claims">Individual Claims</TabsTrigger>
                <TabsTrigger value="json">Custom JSON Payload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="claims" className="space-y-4">
                <div className="space-y-2">
                  {claims.map((claim, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Input
                        placeholder="Claim name"
                        value={claim.key}
                        onChange={(e) => updateClaim(index, "key", e.target.value)}
                        className="w-1/3"
                      />
                      <Input
                        placeholder="Value"
                        value={claim.value}
                        onChange={(e) => updateClaim(index, "value", e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={claim.type}
                        onChange={(e) => updateClaim(index, "type", e.target.value as any)}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeClaim(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={addClaim}
                >
                  <Plus className="h-4 w-4" /> Add Claim
                </Button>
              </TabsContent>
              
              <TabsContent value="json">
                <FormField
                  control={form.control}
                  name="customPayload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Payload (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='{"sub": "1234567890", "name": "John Doe", "admin": true}'
                          className="font-mono min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Token"}
            </Button>
          </form>
        </Form>
        
        {token && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium">Generated Token</h3>
            <JwtTokenDisplay token={token} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
