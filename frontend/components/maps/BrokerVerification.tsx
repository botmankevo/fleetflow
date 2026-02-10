"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface BrokerVerificationProps {
  brokerName?: string;
  mcNumber?: string;
  dotNumber?: string;
  onVerified?: (data: any) => void;
}

export default function BrokerVerification({
  brokerName = "",
  mcNumber = "",
  dotNumber = "",
  onVerified,
}: BrokerVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const verifyBroker = async () => {
    if (!brokerName && !mcNumber && !dotNumber) {
      alert("Please enter broker name, MC number, or DOT number");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch("/fmcsa/verify-broker", {
        method: "POST",
        body: JSON.stringify({
          name: brokerName || undefined,
          mc_number: mcNumber || undefined,
          dot_number: dotNumber || undefined,
        }),
      });

      setResult(response);
      if (onVerified && response.verified) {
        onVerified(response.data);
      }
    } catch (error) {
      console.error("Broker verification error:", error);
      setResult({
        verified: false,
        status: "error",
        message: "Failed to verify broker",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!result) return "gray";
    if (result.verified) return "green";
    return "red";
  };

  const getStatusIcon = () => {
    if (!result) return "❓";
    if (result.verified) return "✅";
    return "❌";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> DOT number lookup is more reliable than MC number.
          Enter both if available.
        </p>
        <button
          onClick={verifyBroker}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Verifying..." : "Verify Broker with FMCSA"}
        </button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-md border-2 ${
            result.verified
              ? "bg-green-50 border-green-500"
              : "bg-red-50 border-red-500"
          }`}
        >
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {result.message}
              </h4>

              {result.data && (
                <div className="text-sm space-y-1 text-gray-700">
                  <p>
                    <strong>Legal Name:</strong> {result.data.legal_name}
                  </p>
                  {result.data.dba_name && (
                    <p>
                      <strong>DBA:</strong> {result.data.dba_name}
                    </p>
                  )}
                  <p>
                    <strong>MC#:</strong> {result.data.mc_number}
                  </p>
                  <p>
                    <strong>DOT#:</strong> {result.data.dot_number}
                  </p>
                  <p>
                    <strong>Status:</strong> {result.data.operating_status}
                  </p>
                  {result.data.safety_rating && (
                    <p>
                      <strong>Safety Rating:</strong> {result.data.safety_rating}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {result.data.physical_address?.street},{" "}
                    {result.data.physical_address?.city},{" "}
                    {result.data.physical_address?.state}{" "}
                    {result.data.physical_address?.zip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
