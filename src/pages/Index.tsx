import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JwtDecoder from '@/components/JwtDecoder';
import JwtGenerator from '@/components/JwtGenerator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen container py-8 md:py-12">
      <header className="mb-8 flex flex-col items-center">
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <a
            href="https://github.com/prijal-bista/jwt-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed top-4 left-4 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-card hover:bg-accent border-primary/20"
            >
              <Github className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">View source on GitHub</span>
            </Button>
          </a>
        </div>
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          JWT Explorer
        </h1>
        <p className="text-muted-foreground mt-2">
          Decode, inspect, and generate JWT tokens with ease
        </p>
      </header>

      <Tabs defaultValue="decode" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="decode">Decode Token</TabsTrigger>
          <TabsTrigger value="generate">Generate Token</TabsTrigger>
        </TabsList>

        <TabsContent value="decode">
          <JwtDecoder />
        </TabsContent>

        <TabsContent value="generate">
          <JwtGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
