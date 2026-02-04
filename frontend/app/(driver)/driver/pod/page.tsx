"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "../../../../components/SignaturePad";
import { apiFetch, getErrorMessage, getToken } from "../../../../lib/api";

type Load = {
  id: number;
  load_number: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
};

export default function PodPage() {
  const [assignedLoads, setAssignedLoads] = useState<Load[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<"BOL" | "Lumper" | "Receipt" | "Other">("BOL");
  const [files, setFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [lastSubmissionIds, setLastSubmissionIds] = useState<number[]>([]);
  const [showBOLGenerator, setShowBOLGenerator] = useState(false);
  const [showShipperSignature, setShowShipperSignature] = useState(false);
  const [showDeliverySignature, setShowDeliverySignature] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [imageRotation, setImageRotation] = useState<{ [key: number]: number }>({});
  const [arrivals, setArrivals] = useState<{ pickup?: Date; delivery?: Date }>({});
  const [departures, setDepartures] = useState<{ pickup?: Date; delivery?: Date }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const me = await apiFetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (me?.role !== "driver" && me?.role !== "admin" && me?.role !== "dispatcher") {
          router.replace("/login");
          return;
        }
        setDriverId(me.id);
        
        // Fetch assigned loads for this driver
        try {
          const loads = await apiFetch(`/drivers/${me.id}/loads`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAssignedLoads(loads || []);
        } catch (err) {
          console.error("Failed to load assigned loads:", err);
          setAssignedLoads([]);
        }
        
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  async function submit() {
    setError(null);
    setMessage(null);
    
    // Validation
    if (!selectedLoadId) {
      setError("Please select a load");
      return;
    }
    if (files.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    setUploading(true);
    const token = getToken();
    if (!token) return;

    try {
      const submissionIds: number[] = [];
      
      // Upload each file as a separate document submission
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("load_id", selectedLoadId.toString());
        form.append("document_type", documentType);
        form.append("notes", notes);
        if (driverId) {
          form.append("driver_id", driverId.toString());
        }

        // Add signature if provided
        if (signature) {
          const blob = await (await fetch(signature)).blob();
          form.append("signature", new File([blob], "signature.png", { type: "image/png" }));
        }

        const result = await apiFetch("/pod/submit", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        
        if (result.document_id) {
          submissionIds.push(result.document_id);
        }
      }

      setMessage(`✅ Success! ${files.length} document(s) submitted for review`);
      setLastSubmissionIds(submissionIds);
      
      // Show undo button for 5 seconds
      setShowUndoButton(true);
      setTimeout(() => {
        setShowUndoButton(false);
        setLastSubmissionIds([]);
      }, 5000);
      
      // Reset form
      setFiles([]);
      setSignature(null);
      setNotes("");
      setDocumentType("BOL");
      setSelectedLoadId(null);
      
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: "smooth" });
      
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  }

  async function undoSubmission() {
    const token = getToken();
    if (!token || lastSubmissionIds.length === 0) return;

    try {
      // Delete each submitted document
      for (const docId of lastSubmissionIds) {
        await apiFetch(`/pod/documents/${docId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      
      setMessage("✅ Submission cancelled successfully");
      setShowUndoButton(false);
      setLastSubmissionIds([]);
    } catch (err) {
      setError("Failed to undo submission");
    }
  }

  function handleCameraCapture() {
    cameraInputRef.current?.click();
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      setError(null);
    }
  }

  function rotateImage(index: number) {
    setImageRotation((prev) => ({
      ...prev,
      [index]: ((prev[index] || 0) + 90) % 360,
    }));
  }

  function markArrival(location: "pickup" | "delivery") {
    setArrivals((prev) => ({
      ...prev,
      [location]: new Date(),
    }));
  }

  function markDeparture(location: "pickup" | "delivery") {
    setDepartures((prev) => ({
      ...prev,
      [location]: new Date(),
    }));
  }

  function calculateDetention(arrival?: Date, departure?: Date) {
    if (!arrival || !departure) return null;
    const diffMs = departure.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return { hours, minutes, total: diffMins };
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-white text-lg">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">📄 Upload Documents</h1>
          <p className="text-blue-200">Submit POD, BOL, receipts and other documents</p>
        </div>

        {/* Success Message with Undo */}
        {message && (
          <div className="bg-green-500 text-white rounded-xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">{message}</p>
                <p className="text-sm mt-1">Your documents are being reviewed by dispatch</p>
              </div>
              {showUndoButton && (
                <button
                  onClick={undoSubmission}
                  className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white rounded-xl p-4 flex items-start gap-3 shadow-lg">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowBOLGenerator(true)}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-semibold flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate BOL
          </button>
          
          <button
            onClick={() => router.push("/driver/pod-history")}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          {/* Load Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📦 Select Load <span className="text-red-500">*</span>
            </label>
            {assignedLoads.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-medium">No loads assigned yet</p>
                <p className="text-sm text-yellow-600 mt-1">Contact dispatch if you believe this is an error</p>
              </div>
            ) : (
              <select
                value={selectedLoadId || ""}
                onChange={(e) => setSelectedLoadId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 font-medium"
              >
                <option value="">-- Choose a load --</option>
                {assignedLoads.map((load) => (
                  <option key={load.id} value={load.id}>
                    {load.load_number} - {load.pickup_address} → {load.delivery_address} ({load.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📑 Document Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["BOL", "Lumper", "Receipt", "Other"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocumentType(type)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    documentType === type
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📎 Upload Files <span className="text-red-500">*</span>
            </label>
            
            {/* Upload Options Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
              
              <button
                type="button"
                onClick={handleCameraCapture}
                className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Camera
              </button>
              
              <button
                type="button"
                onClick={handleCameraCapture}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan
              </button>
            </div>
            
            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              className="hidden"
            />
            
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              
              <p className="text-sm font-medium text-gray-700">
                or drag & drop files here
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported: JPG, PNG, PDF (Max 10MB per file)
              </p>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">Selected Files:</p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                          {imageRotation[index] ? ` • Rotated ${imageRotation[index]}°` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.type.startsWith("image/") && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingImageIndex(index)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit/Preview"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => rotateImage(index)}
                            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Rotate 90°"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Arrival/Departure Tracking for Detention Pay */}
          {selectedLoadId && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-1 flex items-center gap-2">
                📍 Location Tracking
                <span className="text-sm font-normal text-amber-700">(For Detention Pay)</span>
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Mark your arrival and departure times for accurate detention tracking
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Pickup Location */}
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    📦 Pickup Location
                  </h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => markArrival("pickup")}
                      disabled={!!arrivals.pickup}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        arrivals.pickup
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {arrivals.pickup ? "✓ Arrived" : "Mark Arrival"}
                    </button>
                    {arrivals.pickup && (
                      <p className="text-xs text-gray-600 text-center">
                        {arrivals.pickup.toLocaleString()}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => markDeparture("pickup")}
                      disabled={!arrivals.pickup || !!departures.pickup}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        departures.pickup
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : arrivals.pickup
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {departures.pickup ? "✓ Departed" : "Mark Departure"}
                    </button>
                    {departures.pickup && (
                      <p className="text-xs text-gray-600 text-center">
                        {departures.pickup.toLocaleString()}
                      </p>
                    )}

                    {arrivals.pickup && departures.pickup && (
                      <div className="mt-3 p-2 bg-amber-100 rounded-lg">
                        <p className="text-sm font-semibold text-amber-900 text-center">
                          Time at Pickup:{" "}
                          {calculateDetention(arrivals.pickup, departures.pickup)?.hours}h{" "}
                          {calculateDetention(arrivals.pickup, departures.pickup)?.minutes}m
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🏭 Delivery Location
                  </h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => markArrival("delivery")}
                      disabled={!!arrivals.delivery}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        arrivals.delivery
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {arrivals.delivery ? "✓ Arrived" : "Mark Arrival"}
                    </button>
                    {arrivals.delivery && (
                      <p className="text-xs text-gray-600 text-center">
                        {arrivals.delivery.toLocaleString()}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => markDeparture("delivery")}
                      disabled={!arrivals.delivery || !!departures.delivery}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        departures.delivery
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : arrivals.delivery
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {departures.delivery ? "✓ Departed" : "Mark Departure"}
                    </button>
                    {departures.delivery && (
                      <p className="text-xs text-gray-600 text-center">
                        {departures.delivery.toLocaleString()}
                      </p>
                    )}

                    {arrivals.delivery && departures.delivery && (
                      <div className="mt-3 p-2 bg-amber-100 rounded-lg">
                        <p className="text-sm font-semibold text-amber-900 text-center">
                          Time at Delivery:{" "}
                          {calculateDetention(arrivals.delivery, departures.delivery)?.hours}h{" "}
                          {calculateDetention(arrivals.delivery, departures.delivery)?.minutes}m
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-amber-700 bg-amber-100 rounded-lg p-3">
                <p className="font-semibold mb-1">💡 Detention Pay Tip:</p>
                <p>
                  Most contracts pay detention after 2 hours at location. Your times are
                  automatically tracked and submitted with this load.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💬 Notes / Comments
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional information (optional)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Signature Pad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ✍️ Signature
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Signature will timestamp load completion
            </p>
            <SignaturePad onChange={setSignature} />
            {signature && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Signed at {new Date().toLocaleString()}
              </div>
            )}
          </div>

          {/* Delivery Email Option */}
          {signature && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="emailReceiver"
                  checked={showEmailOption}
                  onChange={(e) => setShowEmailOption(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="emailReceiver" className="font-semibold text-gray-900 cursor-pointer">
                    Email copy to receiver
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Send delivery confirmation to the receiver
                  </p>
                  {showEmailOption && (
                    <input
                      type="email"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      placeholder="receiver@company.com"
                      className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={submit}
            disabled={uploading || !selectedLoadId || files.length === 0}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Documents
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-300 rounded-xl p-4 text-white">
          <h3 className="font-semibold mb-2">📌 Important Notes:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside text-blue-100">
            <li>Submit documents as soon as delivery is complete</li>
            <li>Upload clear, legible photos or PDFs</li>
            <li>Your documents will be reviewed by dispatch</li>
            <li>You'll be notified once approved</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
