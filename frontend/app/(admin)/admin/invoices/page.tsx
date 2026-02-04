"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "../../../../lib/api";
import {
  DollarSign,
  FileText,
  Send,
  Download,
  Eye,
  Plus,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Invoice = {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  load_id: number;
  load_number?: string;
  amount: number;
  status: string;
  due_date: string;
  issue_date: string;
  paid_date?: string;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const token = getToken();
      const data = await apiFetch("/invoices", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-accent/20 text-accent border-accent/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case "overdue":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "draft":
        return "bg-muted text-muted-foreground border-glass-border";
      default:
        return "bg-secondary text-foreground border-glass-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return CheckCircle2;
      case "pending":
        return Clock;
      case "overdue":
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter = filter === "all" || inv.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.load_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ai-heading">Invoicing</h1>
          <p className="text-muted-foreground mt-1">Manage billing and accounts receivable</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="gradient-bg-main text-white rounded-xl hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-primary",
          },
          {
            label: "Paid",
            value: `$${paidAmount.toLocaleString()}`,
            icon: CheckCircle2,
            color: "text-accent",
          },
          {
            label: "Pending",
            value: `$${pendingAmount.toLocaleString()}`,
            icon: Clock,
            color: "text-yellow-500",
          },
          {
            label: "Overdue",
            value: `$${overdueAmount.toLocaleString()}`,
            icon: AlertCircle,
            color: "text-destructive",
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="ai-card p-5 animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </span>
                <div className={cn("p-2 rounded-lg bg-secondary/50", stat.color)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold ai-text text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="ai-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-glass-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["all", "paid", "pending", "overdue", "draft"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  filter === status
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="ai-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/30 border-b border-glass-border">
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Load
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Due Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/20">
              {filteredInvoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.status);
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-secondary/30 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground ai-text">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{invoice.customer_name || "Unknown"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {invoice.load_number || `#${invoice.load_id}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold ai-text text-foreground">
                        ${invoice.amount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(invoice.status))}>
                        <StatusIcon className="w-3 h-3" />
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("View invoice PDF");
                          }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Download invoice");
                          }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Download className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Send invoice");
                          }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Send className="w-4 h-4 text-muted-foreground hover:text-accent" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try a different search" : "Create your first invoice to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
