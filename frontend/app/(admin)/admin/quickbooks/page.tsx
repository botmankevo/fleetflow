"use client";

import { useState, useEffect } from "react";
import { quickbooksApi } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

export default function QuickBooksPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await quickbooksApi.getStatus();
      setStatus(data);
    } catch (error: any) {
      toast.error("Failed to load QuickBooks status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const data = await quickbooksApi.initiateOAuth();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      toast.error("Failed to initiate QuickBooks connection");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect QuickBooks?")) return;
    
    try {
      await quickbooksApi.disconnect();
      toast.success("QuickBooks disconnected successfully");
      loadStatus();
    } catch (error: any) {
      toast.error("Failed to disconnect QuickBooks");
    }
  };

  const handleRefreshToken = async () => {
    try {
      await quickbooksApi.refreshToken();
      toast.success("Token refreshed successfully");
      loadStatus();
    } catch (error: any) {
      toast.error("Failed to refresh token");
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const data = await quickbooksApi.testConnection();
      if (data.connected) {
        toast.success(`Connected to: ${data.company_name}`);
      } else {
        toast.error("Connection test failed");
      }
    } catch (error: any) {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncCustomers = async () => {
    try {
      setSyncing(true);
      const data = await quickbooksApi.syncCustomers();
      toast.success(`Synced ${data.synced_count} of ${data.total_customers} customers`);
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} errors occurred during sync`);
      }
    } catch (error: any) {
      toast.error("Failed to sync customers");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncInvoices = async () => {
    try {
      setSyncing(true);
      const data = await quickbooksApi.syncInvoices();
      toast.success(`Synced ${data.synced_count} of ${data.total_invoices} invoices`);
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} errors occurred during sync`);
      }
    } catch (error: any) {
      toast.error("Failed to sync invoices");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isConnected = status?.connected;
  const isExpired = status?.is_expired;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QuickBooks Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect MainTMS to QuickBooks for automated accounting
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="text-sm">
          {isConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
            Connection Status
          </CardTitle>
          <CardDescription>
            {isConnected
              ? "Your QuickBooks account is connected"
              : "Connect your QuickBooks account to sync data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company ID</p>
                  <p className="font-medium">{status.realm_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected Since</p>
                  <p className="font-medium">
                    {new Date(status.connected_since).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token Expires</p>
                  <p className="font-medium">
                    {new Date(status.token_expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={isExpired ? "destructive" : "default"}>
                    {isExpired ? "Expired" : "Active"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleTestConnection} disabled={testing}>
                  {testing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Test Connection
                </Button>
                {isExpired && (
                  <Button onClick={handleRefreshToken} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Token
                  </Button>
                )}
                <Button onClick={handleDisconnect} variant="destructive">
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={handleConnect} size="lg">
              <Link2 className="mr-2 h-4 w-4" />
              Connect to QuickBooks
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sync Options Card */}
      {isConnected && !isExpired && (
        <Card>
          <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>
              Sync your MainTMS data with QuickBooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Sync Customers</h3>
                <p className="text-sm text-muted-foreground">
                  Push all customers from MainTMS to QuickBooks
                </p>
              </div>
              <Button
                onClick={handleSyncCustomers}
                disabled={syncing}
                variant="outline"
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Sync Invoices</h3>
                <p className="text-sm text-muted-foreground">
                  Push invoices from MainTMS to QuickBooks
                </p>
              </div>
              <Button
                onClick={handleSyncInvoices}
                disabled={syncing}
                variant="outline"
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Connect to QuickBooks" above</li>
              <li>Sign in to your QuickBooks account</li>
              <li>Authorize MainTMS to access your QuickBooks data</li>
              <li>You'll be redirected back to this page</li>
              <li>Start syncing your data!</li>
            </ol>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> You need QuickBooks Online to use this integration.
                Desktop versions are not supported. Make sure your administrator has set up
                the QuickBooks API credentials in the backend.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
