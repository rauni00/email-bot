import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, UserPlus, Loader2 } from "lucide-react";
import { api } from "@shared/routes";

const quickSendSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type QuickSendData = z.infer<typeof quickSendSchema>;

export default function QuickSend() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  
  const form = useForm<QuickSendData>({
    resolver: zodResolver(quickSendSchema),
    defaultValues: {
      name: "",
      email: "",
    }
  });

  const onSubmit = async (data: QuickSendData) => {
    setIsSending(true);
    try {
      const response = await fetch("/api/contacts/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      toast({
        title: "Success",
        description: `Email sent to ${data.email} and contact saved.`,
      });
      form.reset();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Quick Send</h1>
        <p className="text-muted-foreground mt-1">Immediately send your application to an HR contact.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>HR Details</CardTitle>
              <CardDescription>Enter the contact info to send your resume instantly.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">HR Name</Label>
              <Input 
                id="name" 
                {...form.register("name")} 
                placeholder="John Doe" 
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">HR Email</Label>
              <Input 
                id="email" 
                {...form.register("email")} 
                placeholder="hr@company.com" 
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Application Now
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <h4 className="text-sm font-semibold mb-2">What happens next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-4">
          <li>The HR contact will be saved to your database.</li>
          <li>Your configured email (from Settings) will be sent immediately.</li>
          <li>Your resume PDF will be attached automatically.</li>
          <li>This skip the working hours check for instant outreach.</li>
        </ul>
      </div>
    </div>
  );
}
