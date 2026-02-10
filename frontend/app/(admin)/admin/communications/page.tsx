"use client";

import { useState, useEffect } from "react";
import { communicationsApi } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, MessageSquare, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

export default function CommunicationsPage() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [smsForm, setSmsForm] = useState({
    to: "",
    message: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await communicationsApi.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to load templates");
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await communicationsApi.sendEmail(emailForm);
      toast.success("Email sent successfully!");
      setEmailForm({ to: "", subject: "", body: "" });
    } catch (error: any) {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsForm.to || !smsForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await communicationsApi.sendSMS(smsForm);
      toast.success("SMS sent successfully!");
      setSmsForm({ to: "", message: "" });
    } catch (error: any) {
      toast.error("Failed to send SMS");
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setLoading(true);
      const data = await communicationsApi.testEmail();
      if (data.success) {
        toast.success(`Test email sent to your account!`);
      } else {
        toast.error(data.message || "Email test failed");
      }
    } catch (error: any) {
      toast.error("Failed to test email configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    const phone = prompt("Enter phone number to receive test SMS (with country code, e.g., +1234567890):");
    if (!phone) return;

    try {
      setLoading(true);
      const data = await communicationsApi.testSMS(phone);
      if (data.success) {
        toast.success(`Test SMS sent to ${phone}!`);
      } else {
        toast.error(data.message || "SMS test failed");
      }
    } catch (error: any) {
      toast.error("Failed to test SMS configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="text-muted-foreground mt-2">
            Send emails and SMS messages to drivers, customers, and team members
          </p>
        </div>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="mr-2 h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test Configuration</TabsTrigger>
        </TabsList>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Email</CardTitle>
              <CardDescription>
                Send an email to any recipient
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>To (Email Address)</Label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                />
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={8}
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                />
              </div>

              <Button onClick={handleSendEmail} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS</CardTitle>
              <CardDescription>
                Send a text message to any phone number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>To (Phone Number)</Label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={smsForm.to}
                  onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={6}
                  maxLength={160}
                  value={smsForm.message}
                  onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {smsForm.message.length}/160 characters
                </p>
              </div>

              <Button onClick={handleSendSMS} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for common notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {template.variables.map((variable: string) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Configuration Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Verify that email and SMS services are properly configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Send a test email to verify SendGrid is working
                  </p>
                </div>
                <Button onClick={handleTestEmail} disabled={loading} variant="outline">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Test Email
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS Configuration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Send a test SMS to verify Twilio is working
                  </p>
                </div>
                <Button onClick={handleTestSMS} disabled={loading} variant="outline">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Test SMS
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Make sure your administrator has configured the
                  SendGrid and Twilio API credentials in the backend environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
