"use client";

import { useState } from "react";
import { X, Upload, FileText, Plus, GripVertical, Trash2, Building2, User, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface Stop {
  id: string;
  type: "pickup" | "delivery";
  address: string;
  city: string;
  state: string;
  zip: string;
  scheduledDate: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

interface EnhancedCreateLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drivers: Array<{ id: number; name: string; truck_id?: number; trailer_id?: number }>;
  brokers: Array<{ id: number; name: string }>;
  equipment: Array<{ id: number; identifier: string; equipment_type: string }>;
}

type ViewMode = "choice" | "manual" | "ocr" | "review";

export default function EnhancedCreateLoadModal({
  isOpen,
  onClose,
  onSuccess,
  drivers,
  brokers,
  equipment,
}: EnhancedCreateLoadModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("choice");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    loadNumber: "",
    status: "Created",
    driverId: "",
    brokerId: "",
    brokerName: "",
    poNumber: "",
    rateAmount: "",
    notes: "",
  });

  const [stops, setStops] = useState<Stop[]>([
    {
      id: "1",
      type: "pickup",
      address: "",
      city: "",
      state: "",
      zip: "",
      scheduledDate: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    },
    {
      id: "2",
      type: "delivery",
      address: "",
      city: "",
      state: "",
      zip: "",
      scheduledDate: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showCreateBroker, setShowCreateBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string>('');
  const [pdfZoom, setPdfZoom] = useState(100);
  const [originalOcrText, setOriginalOcrText] = useState<string>('');

  // Helper to convert MM/DD/YYYY HH:MMAM/PM to YYYY-MM-DDTHH:MM format
  const convertToDateTimeLocal = (dateStr: string, timeStr: string) => {
    try {
      const [month, day, year] = dateStr.split('/');
      let [time, period] = timeStr.match(/(\d{2}:\d{2})([AP]M)/)?.slice(1, 3) || ['', ''];
      
      if (time && period) {
        let [hours, minutes] = time.split(':').map(n => parseInt(n));
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const hourStr = hours.toString().padStart(2, '0');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hourStr}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Date conversion error:', e);
    }
    return '';
  };

  // Parse raw OCR text into structured data
  const parseRateConfirmation = (rawText: string) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
    
    const parsed: any = {
      load_number: '',
      broker_name: '',
      po_number: '',
      rate_amount: '',
      mc_number: '',
      weight: '',
      commodity: '',
      addresses: []
    };

    // Extract load/order number
    const orderMatch = rawText.match(/Order[:\s]+(\d+)/i);
    if (orderMatch) parsed.load_number = orderMatch[1];

    // Extract carrier/broker name (the company shipping the load)
    const carrierMatch = rawText.match(/Carrier[:\s]+([^\n]+)/i);
    if (carrierMatch) parsed.broker_name = carrierMatch[1].trim();

    // Extract BOL/Reference number (often used as PO)
    const bolMatch = rawText.match(/BOL[:\s#]*([A-Z0-9-]+)/i);
    const refMatch = rawText.match(/Reference[:\s#]*([A-Z0-9-]+)/i);
    parsed.po_number = bolMatch ? bolMatch[1] : (refMatch ? refMatch[1] : '');

    // Extract weight (look for weight field, not just numbers)
    const weightMatch = rawText.match(/Weight[:\s]+([\d.,]+)/i);
    if (weightMatch) parsed.weight = weightMatch[1];

    // Extract rate/amount - look for "Carrier Freight Pay:" or similar with $ amount
    const carrierPayMatch = rawText.match(/Carrier\s+Freight\s+Pay[:\s]+\$\s*([\d,]+\.?\d{0,2})/i);
    const paymentMatch = rawText.match(/Payment[:\s]+\$\s*([\d,]+\.?\d{0,2})/i);
    const rateMatch = rawText.match(/\$\s*([\d,]+\.?\d{0,2})/);
    
    if (carrierPayMatch) {
        parsed.rate_amount = carrierPayMatch[1].replace(/,/g, ''); // Remove commas
        console.log('✓ Rate extracted:', parsed.rate_amount);
    } else if (paymentMatch) {
        parsed.rate_amount = paymentMatch[1].replace(/,/g, '');
    } else if (rateMatch && parseFloat(rateMatch[1].replace(/,/g, '')) > 100) {
        parsed.rate_amount = rateMatch[1].replace(/,/g, '');
    }

    // Extract miles (separate from rate)
    const milesMatch = rawText.match(/Miles[:\s]+([\d.,]+)/i);
    if (milesMatch) parsed.miles = milesMatch[1];

    // Extract pickup location (PU1, PU2, etc.) - More flexible pattern
    const puMatches = [...rawText.matchAll(/PU\d+\s+Name[:\s]+([^\n]+)[\s\S]{0,200}?Address[:\s]+([^\n]+)[\s\S]{0,100}?\n\s*([A-Z][A-Z\s]+)[\s\S]{0,200}?Date[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}[AP]M)/gi)];
    
    puMatches.forEach(match => {
      const [_, name, address, city, date, time] = match;
      
      // Convert date format from MM/DD/YYYY HH:MMAM/PM to YYYY-MM-DDTHH:MM
      const dateStr = convertToDateTimeLocal(date, time);
      
      parsed.addresses.push({
        type: 'pickup',
        full_address: address.trim(),
        city: city.trim(),
        state: '',
        zip: '',
        date: dateStr,
        contactName: name.trim(),
        contactPhone: '',
        notes: ''
      });
    });

    // Extract delivery location (SO1, SO2, etc.) - More flexible pattern
    const soMatches = [...rawText.matchAll(/SO\d+\s+Name[:\s]+([^\n]+)[\s\S]{0,200}?Address[:\s]+([^\n]+)[\s\S]{0,100}?\n\s*([A-Z][A-Z\s]+)[\s\S]{0,200}?Date[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}[AP]M)/gi)];
    
    soMatches.forEach(match => {
      const [_, name, address, city, date, time] = match;
      const dateStr = convertToDateTimeLocal(date, time);
      
      parsed.addresses.push({
        type: 'delivery',
        full_address: address.trim(),
        city: city.trim(),
        state: '',
        zip: '',
        date: dateStr,
        contactName: name.trim(),
        contactPhone: '',
        notes: ''
      });
    });

    // Fallback: If no PU/SO matches, try simpler extraction
    if (parsed.addresses.length === 0) {
      const pu1Match = rawText.match(/PU1\s+Name[:\s]+([^\n]+)/i);
      const pu1AddressMatch = rawText.match(/PU1[^\n]*\n[^\n]*Address[:\s]+([^\n]+)/i);
      const pu1CityMatch = rawText.match(/Address[:\s]+[^\n]+\n\s*([A-Z\s]+)\s*\n/);
      const pu1DateMatch = rawText.match(/Date[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}[AP]M)/);

      if (pu1AddressMatch) {
        parsed.addresses.push({
          type: 'pickup',
          full_address: pu1AddressMatch[1].trim(),
          city: pu1CityMatch ? pu1CityMatch[1].trim() : '',
          state: '',
          zip: '',
          date: pu1DateMatch ? `${pu1DateMatch[1]} ${pu1DateMatch[2]}` : '',
          notes: pu1Match ? pu1Match[1].trim() : ''
        });
      }

      const so2AddressMatch = rawText.match(/SO2[^\n]*\n[^\n]*Address[:\s]+([^\n]+)/i);
      const so2CityMatch = rawText.match(/SO2[^\n]*\n[^\n]*\n\s*([A-Z\s]+)\s*\n/);
      const allDates = [...rawText.matchAll(/Date[:\s]+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}[AP]M)/g)];
      const deliveryDate = allDates.length > 1 ? allDates[1] : null;

      if (so2AddressMatch) {
        parsed.addresses.push({
          type: 'delivery',
          full_address: so2AddressMatch[1].trim(),
          city: so2CityMatch ? so2CityMatch[1].trim() : '',
          state: '',
          zip: '',
          date: deliveryDate ? `${deliveryDate[1]} ${deliveryDate[2]}` : '',
          notes: ''
        });
      }
    }

    // Extract commodity/description
    const commodityMatch = rawText.match(/Commodity[:\s]+([^\n]+)/i);
    if (commodityMatch) {
      parsed.description = commodityMatch[1].trim();
    }

    return parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Create URL for preview
      const fileUrl = URL.createObjectURL(file);
      setUploadedFileUrl(fileUrl);
      setUploadedFileType(file.type);

      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/loads/parse-rate-con", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to parse rate confirmation");
      }

      const data = await response.json();
      console.log("===== OCR RESPONSE =====");
      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("========================");
      
      let extracted = data.data || data;
      
      // If OCR returned raw text, parse it
      if (typeof extracted === 'string' || extracted.raw_data) {
        const rawText = extracted.raw_data || extracted;
        console.log("Parsing raw OCR text:", rawText);
        setOriginalOcrText(rawText); // Save for learning
        extracted = parseRateConfirmation(rawText);
        console.log("Parsed data:", extracted);
      } else if (typeof data === 'object' && !data.load_number && !data.addresses) {
        // If we got a response object without expected fields, might be wrapped
        console.log("Attempting to find raw text in response...");
        const possibleText = data.text || data.content || data.result || JSON.stringify(data);
        setOriginalOcrText(possibleText); // Save for learning
        extracted = parseRateConfirmation(possibleText);
        console.log("Parsed from fallback:", extracted);
      }

      // Pre-fill form with extracted data - with better handling
      const extractedFormData = {
        loadNumber: extracted.load_number || extracted.loadNumber || "",
        status: "Created",
        driverId: "",
        brokerId: "",
        brokerName: extracted.broker_name || extracted.brokerName || "",
        poNumber: extracted.po_number || extracted.poNumber || "",
        rateAmount: extracted.rate_amount || extracted.rateAmount || "",
        notes: [
          extracted.description || extracted.commodity ? `Commodity: ${extracted.description || extracted.commodity}` : '',
          extracted.weight ? `Weight: ${extracted.weight}` : '',
          extracted.miles ? `Miles: ${extracted.miles}` : '',
          extracted.mc_number || extracted.mcNumber ? `MC: ${extracted.mc_number || extracted.mcNumber}` : ''
        ].filter(Boolean).join(' | '),
      };
      
      console.log("=== SETTING FORM DATA ===");
      console.log("Form values being set:", extractedFormData);
      console.log("========================");
      
      setForm(extractedFormData);

      // Pre-fill stops from extracted addresses
      const addresses = extracted.addresses || extracted.pickup_delivery || [];
      if (addresses && addresses.length > 0) {
        const newStops: Stop[] = addresses.map((addr: any, idx: number) => ({
          id: `${idx + 1}`,
          type: addr.type || (idx === 0 ? "pickup" : "delivery"),
          address: addr.full_address || addr.street || addr.address || "",
          city: addr.city || "",
          state: addr.state || "",
          zip: addr.zip || addr.zip_code || "",
          scheduledDate: addr.date || addr.scheduled_date || "",
          contactName: addr.contactName || addr.contact_name || "",
          contactPhone: addr.contactPhone || addr.contact_phone || "",
          notes: addr.notes || "",
        }));
        console.log('Setting stops with dates:', newStops);
        setStops(newStops);
      }

      setViewMode("review");
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || "Failed to extract data");
    } finally {
      setUploading(false);
    }
  };

  const addStop = (type: "pickup" | "delivery") => {
    setStops([
      ...stops,
      {
        id: Date.now().toString(),
        type,
        address: "",
        city: "",
        state: "",
        zip: "",
        scheduledDate: "",
        notes: "",
      },
    ]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      setError("Must have at least one pickup and one delivery");
      return;
    }
    setStops(stops.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, field: keyof Stop, value: string) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newStops = [...stops];
    const draggedItem = newStops[draggedIndex];
    newStops.splice(draggedIndex, 1);
    newStops.splice(index, 0, draggedItem);
    
    setStops(newStops);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCreateBroker = async () => {
    if (!newBrokerName.trim()) {
      setError("Please enter a broker name");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch("http://localhost:8000/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: newBrokerName.trim(),
          type: "broker",
          email: "", // Optional but might be required
          phone: "", // Optional but might be required
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create broker: ${response.status}`);
      }

      const data = await response.json();
      console.log("Created broker:", data);
      
      // Add to brokers list and select it
      const newBroker = { id: data.id, name: newBrokerName.trim() };
      brokers.push(newBroker);
      
      setForm({ ...form, brokerId: data.id.toString(), brokerName: newBrokerName.trim() });
      setShowCreateBroker(false);
      setNewBrokerName("");
      setError(null);
    } catch (err: any) {
      console.error("Broker creation error:", err);
      setError(err.message || "Failed to create broker");
    }
  };

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === parseInt(driverId));
    setForm({ ...form, driverId });
    // Auto-select driver's truck/trailer if available
    // This would be implemented with additional equipment state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const token = getToken();
      const payload = {
        load_number: form.loadNumber,
        status: form.status,
        driver_id: form.driverId ? parseInt(form.driverId) : null,
        customer_id: form.brokerId ? parseInt(form.brokerId) : null,
        po_number: form.poNumber,
        rate: form.rateAmount ? parseFloat(form.rateAmount) * 100 : 0,
        notes: form.notes,
        stops: stops.map((stop, idx) => ({
          sequence: idx + 1,
          type: stop.type,
          address: stop.address,
          city: stop.city,
          state: stop.state,
          zip_code: stop.zip,
          scheduled_time: stop.scheduledDate || null,
          notes: stop.notes,
        })),
      };

      await apiFetch("/loads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Save OCR learning data if we extracted from a document
      if (originalOcrText && viewMode === "review") {
        try {
          const learningData = {
            original_text: originalOcrText,
            extracted_load_number: form.loadNumber,
            extracted_broker: form.brokerName,
            extracted_rate: form.rateAmount,
            extracted_stops: stops.map(s => ({
              type: s.type,
              address: s.address,
              city: s.city,
              date: s.scheduledDate
            })),
            timestamp: new Date().toISOString()
          };
          
          // Store in localStorage for now (could be sent to backend later)
          const existingLearning = JSON.parse(localStorage.getItem('ocr_learning_data') || '[]');
          existingLearning.push(learningData);
          localStorage.setItem('ocr_learning_data', JSON.stringify(existingLearning));
          
          console.log("✅ OCR learning data saved for future improvements");
        } catch (err) {
          console.warn("Failed to save OCR learning data:", err);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create load");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Load</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Choice View */}
          {viewMode === "choice" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setViewMode("manual")}
                className="p-8 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Manual Entry</h3>
                <p className="text-sm text-muted-foreground">
                  Enter load details manually
                </p>
              </button>

              <button
                onClick={() => setViewMode("ocr")}
                className="p-8 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">AI Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Upload rate confirmation for automatic extraction
                </p>
              </button>
            </div>
          )}

          {/* OCR Upload View */}
          {viewMode === "ocr" && (
            <div className="space-y-6">
              {uploading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Extracting Data from Rate Confirmation...</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This may take 10-30 seconds for PDF files
                  </p>
                  <div className="w-64 mx-auto bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full animate-pulse" style={{ width: "60%" }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Upload Rate Confirmation</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports PDF and image files (PNG, JPG)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="rate-con-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="rate-con-upload">
                      <Button
                        type="button"
                        disabled={uploading}
                        onClick={() => document.getElementById("rate-con-upload")?.click()}
                      >
                        Choose File
                      </Button>
                    </label>
                  </div>
                  <Button variant="outline" onClick={() => setViewMode("choice")}>
                    Back
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Review/Manual View */}
          {(viewMode === "review" || viewMode === "manual") && (
            <div className={`grid gap-6 ${uploadedFileUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Rate Con Preview - Left Side */}
              {uploadedFileUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Rate Confirmation</h3>
                    <div className="flex items-center gap-2">
                      {uploadedFileType === 'application/pdf' && (
                        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPdfZoom(Math.max(50, pdfZoom - 25))}
                            className="h-7 px-2"
                          >
                            -
                          </Button>
                          <span className="text-xs px-2 min-w-[60px] text-center">{pdfZoom}%</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPdfZoom(Math.min(200, pdfZoom + 25))}
                            className="h-7 px-2"
                          >
                            +
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedFileUrl(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-border rounded-lg overflow-auto bg-white sticky top-0">
                    {uploadedFileType === 'application/pdf' ? (
                      <div style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top left', width: `${10000 / pdfZoom}%` }}>
                        <iframe
                          src={`${uploadedFileUrl}#view=FitH`}
                          className="w-full h-[calc(90vh-200px)] border-0"
                          title="Rate Confirmation PDF"
                        />
                      </div>
                    ) : (
                      <img
                        src={uploadedFileUrl}
                        alt="Rate Confirmation"
                        className="w-full h-auto max-h-[calc(90vh-200px)] object-contain bg-white"
                        style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top left' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Form - Right Side (or Full Width) */}
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card className="p-4 space-y-4">
                <h3 className="font-semibold">Load Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Load Number</label>
                    <input
                      type="text"
                      value={form.loadNumber}
                      onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">PO Number</label>
                    <input
                      type="text"
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rate Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.rateAmount}
                      onChange={(e) => setForm({ ...form, rateAmount: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Driver
                    </label>
                    <select
                      value={form.driverId}
                      onChange={(e) => handleDriverChange(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">Select Driver</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Broker
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.brokerId}
                        onChange={(e) => setForm({ ...form, brokerId: e.target.value })}
                        className="flex-1 mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="">Select Broker</option>
                        {brokers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateBroker(true)}
                        className="mt-1"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stops */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Stops</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStop("pickup")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Pickup
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addStop("delivery")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Delivery
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="border border-border rounded-lg p-4 bg-muted/30 cursor-move hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-6" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                              stop.type === "pickup"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {stop.type.toUpperCase()} #{index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStop(stop.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <AddressAutocomplete
                                value={stop.address}
                                onChange={(value) => updateStop(stop.id, "address", value)}
                                placeholder="Street Address (start typing for suggestions)"
                                className="text-sm"
                                onCityStateZip={(city, state, zip) => {
                                  console.log('Autocomplete callback:', { city, state, zip });
                                  if (city) updateStop(stop.id, "city", city);
                                  if (state) updateStop(stop.id, "state", state);
                                  if (zip) updateStop(stop.id, "zip", zip);
                                }}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="City"
                              value={stop.city}
                              onChange={(e) => updateStop(stop.id, "city", e.target.value)}
                              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="State"
                                value={stop.state}
                                onChange={(e) => updateStop(stop.id, "state", e.target.value)}
                                className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                              />
                              <input
                                type="text"
                                placeholder="ZIP"
                                value={stop.zip}
                                onChange={(e) => updateStop(stop.id, "zip", e.target.value)}
                                className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                              />
                            </div>
                            <input
                              type="datetime-local"
                              value={stop.scheduledDate}
                              onChange={(e) => updateStop(stop.id, "scheduledDate", e.target.value)}
                              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Contact Name"
                              value={stop.contactName}
                              onChange={(e) => updateStop(stop.id, "contactName", e.target.value)}
                              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Contact Phone"
                              value={stop.contactPhone}
                              onChange={(e) => updateStop(stop.id, "contactPhone", e.target.value)}
                              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <textarea
                              placeholder="Notes / Special Instructions"
                              value={stop.notes}
                              onChange={(e) => updateStop(stop.id, "notes", e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewMode("choice")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Load"}
                </Button>
              </div>
              </form>
            </div>
          )}
        </div>

        {/* Create Broker Modal */}
        {showCreateBroker && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Card className="p-6 max-w-md w-full m-4">
              <h3 className="text-lg font-semibold mb-4">Create New Broker</h3>
              <input
                type="text"
                placeholder="Broker Name"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background mb-4"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateBroker(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateBroker}
                  className="flex-1"
                  disabled={!newBrokerName}
                >
                  Create
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
