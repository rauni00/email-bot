import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useUpdateSettings, useTestEmail } from "@/hooks/use-settings";
import { insertSettingsSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Mail, Server, Clock, ShieldCheck, Send, FileUp } from "lucide-react";

// Extend schema for form validation
const formSchema = insertSettingsSchema;
type FormData = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const { mutate: sendTest, isPending: isSendingTest } = useTestEmail();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      smtpSecure: false,
      emailSubject: "",
      emailBody: "",
      delayMin: 180,
      delayMax: 240,
      isActive: false,
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        smtpPass: "", // Don't show password
      });
    }
  }, [settings, form]);

  const onSubmit = (data: FormData) => {
    const updates = { ...data };
    if (!updates.smtpPass) delete updates.smtpPass; // Don't send empty pass

    updateSettings(updates, {
      onSuccess: () => {
        toast({ title: "Settings Saved", description: "Your configuration has been updated." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({ title: "Email required", description: "Please enter a test email address", variant: "destructive" });
      return;
    }
    sendTest(testEmail, {
      onSuccess: () => {
        toast({ title: "Test Sent", description: "Check your inbox for the test email." });
      },
      onError: (err) => {
        toast({ title: "Test Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const onResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/settings/resume", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast({ title: "Resume Uploaded", description: "Your resume has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your SMTP server and automation behavior.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border p-2 rounded-xl">
          <Input 
            placeholder="Test email address" 
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={handleTestEmail} disabled={isSendingTest}>
            <Send className="w-4 h-4 mr-2" />
            {isSendingTest ? "Sending..." : "Test SMTP"}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* SMTP CONFIGURATION */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>Enter your email provider details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input {...form.register("smtpHost")} placeholder="smtp.gmail.com" />
              {form.formState.errors.smtpHost && <p className="text-xs text-red-500">{form.formState.errors.smtpHost.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input type="number" {...form.register("smtpPort", { valueAsNumber: true })} placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label>Username / Email</Label>
              <Input {...form.register("smtpUser")} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...form.register("smtpPass")} placeholder="••••••••" />
              <p className="text-xs text-muted-foreground">Leave blank to keep existing password</p>
            </div>
            <div className="flex items-center space-x-2 md:col-span-2 pt-2">
              <Switch 
                checked={form.watch("smtpSecure")}
                onCheckedChange={(c) => form.setValue("smtpSecure", c)}
                id="secure-mode"
              />
              <Label htmlFor="secure-mode" className="font-normal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Use Secure Connection (SSL/TLS)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* EMAIL CONTENT */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Define the template for your automated emails.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input {...form.register("emailSubject")} placeholder="Job Application - [Your Name]" />
            </div>
            <div className="space-y-2">
              <Label>Email Body (HTML Supported)</Label>
              <Textarea 
                {...form.register("emailBody")} 
                className="min-h-[300px] font-mono text-sm" 
                placeholder="<html><body><h1>Hello</h1></body></html>" 
              />
              <p className="text-xs text-muted-foreground">You can enter plain text or HTML formatting.</p>
            </div>
          </CardContent>
        </Card>

        {/* AUTOMATION SETTINGS */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Resume Attachment</CardTitle>
                <CardDescription>Upload a PDF resume to attach to outgoing emails.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById("resume-upload")?.click()}
                  disabled={isUploading}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload PDF Resume"}
                </Button>
                <input 
                  id="resume-upload" 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={onResumeUpload} 
                />
                {settings?.resumeFilename && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Resume uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">This PDF will be attached to every outreach email sent by the engine.</p>
            </div>
          </CardContent>
        </Card>

        {/* AUTOMATION SETTINGS */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Timing & Delays</CardTitle>
                <CardDescription>Control the speed of your automation to avoid spam filters.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Min Delay (seconds)</Label>
              <Input type="number" {...form.register("delayMin", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Max Delay (seconds)</Label>
              <Input type="number" {...form.register("delayMax", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-12">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
