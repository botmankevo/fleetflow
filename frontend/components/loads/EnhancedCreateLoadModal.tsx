"use client";

import { useState } from "react";
import { X, Upload, FileText, Plus, GripVertical, Trash2, Building2, User, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken, API_BASE } from "@/lib/api";
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
  website?: string;
  hours?: string;
  notes: string;
}

interface EnhancedCreateLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drivers: Array<{ id: number; name: string; truck_id?: number; trailer_id?: number }>;
  brokers: Array<{ id: number; name: string }>;
  equipment: Array<{ id: number; identifier: string; equipment_type: string }>;
  editLoad?: any; // New prop for editing
}

type ViewMode = "choice" | "manual" | "ocr" | "review";

export default function EnhancedCreateLoadModal({
  isOpen,
  onClose,
  onSuccess,
  drivers,
  brokers,
  equipment,
  editLoad,
}: EnhancedCreateLoadModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(editLoad ? "review" : "choice");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    loadNumber: editLoad?.load_number || "",
    status: editLoad?.status || "Created",
    driverId: editLoad?.driver_id?.toString() || "",
    brokerId: editLoad?.customer_id?.toString() || "",
    brokerName: editLoad?.broker_name || "",
    poNumber: editLoad?.po_number || "",
    rateAmount: editLoad?.rate_amount?.toString() || "",
    notes: editLoad?.notes || "",
    loadType: editLoad?.load_type || "Full",
    weight: editLoad?.weight?.toString() || "",
    pallets: editLoad?.pallets?.toString() || "",
    lengthFt: editLoad?.length_ft?.toString() || "",
    fuelSurcharge: editLoad?.fuel_surcharge?.toString() || "0",
    detention: editLoad?.detention?.toString() || "0",
    layover: editLoad?.layover?.toString() || "0",
    lumper: editLoad?.lumper?.toString() || "0",
    otherFees: editLoad?.other_fees?.toString() || "0",
    rcDocument: editLoad?.rc_document || "",
    truckId: editLoad?.truck_id?.toString() || "",
    trailerId: editLoad?.trailer_id?.toString() || "",
  });

  const [stops, setStops] = useState<Stop[]>(editLoad?.stops?.map((s: any) => ({
    id: s.id.toString(),
    type: s.stop_type,
    address: s.address || "",
    city: s.city || "",
    state: s.state || "",
    zip: s.zip_code || "",
    scheduledDate: s.date || "",
    contactName: s.company || "",
    contactPhone: s.phone || "",
    website: s.website || "",
    hours: s.hours || "",
    notes: s.notes || "",
  })) || [
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
      website: "",
      hours: "",
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
      website: "",
      hours: "",
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
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [showEditStopModal, setShowEditStopModal] = useState(false);

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

      const [data, uploadRes] = await Promise.all([
        apiFetch("/loads/parse-rate-con", {
          method: "POST",
          body: formData,
        }),
        apiFetch("/document-uploads/upload", {
          method: "POST",
          body: formData,
        })
      ]);
      
      console.log("===== OCR RESPONSE =====", data);
      console.log("===== UPLOAD RESPONSE =====", uploadRes);

      const extracted = data.data || {};
      const rawText = data.raw_text || "";
      setOriginalOcrText(rawText);
      
      const permanentUrl = uploadRes.file_url || fileUrl;

      setForm(prev => ({
        ...prev,
        loadNumber: extracted.load_number || extracted.loadNumber || prev.loadNumber,
        brokerName: extracted.broker_name || extracted.brokerName || prev.brokerName,
        poNumber: extracted.po_number || extracted.poNumber || prev.poNumber,
        rateAmount: extracted.rate_amount || extracted.rateAmount || prev.rateAmount,
        weight: extracted.weight || prev.weight,
        pallets: extracted.pallets || prev.pallets,
        lengthFt: extracted.length_ft || extracted.lengthFt || prev.lengthFt,
        fuelSurcharge: extracted.fuel_surcharge || extracted.fuelSurcharge || prev.fuelSurcharge,
        detention: extracted.detention || prev.detention,
        layover: extracted.layover || prev.layover,
        lumper: extracted.lumper || prev.lumper,
        otherFees: extracted.other_fees || extracted.otherFees || prev.otherFees,
        rcDocument: permanentUrl,
        notes: [
          extracted.commodity ? `Commodity: ${extracted.commodity}` : '',
          extracted.equipment_type ? `Equipment: ${extracted.equipment_type}` : '',
          extracted.stop_count ? `Stops: ${extracted.stop_count}` : ''
        ].filter(Boolean).join(' | ') || prev.notes
      }));

      // Pre-fill stops from extracted addresses
      const addresses = extracted.addresses || [];
      if (addresses && addresses.length > 0) {
        const newStops: Stop[] = addresses.map((addr: any, idx: number) => ({
          id: `${idx + 1}`,
          type: addr.type || (idx === 0 ? "pickup" : (idx === addresses.length - 1 ? "delivery" : "delivery")),
          address: addr.street || addr.full_address || "",
          city: addr.city || "",
          state: addr.state || "",
          zip: addr.zip || "",
          scheduledDate: addr.date || (idx === 0 ? extracted.pickup_date : (idx === addresses.length - 1 ? extracted.delivery_date : "")) || "",
          contactName: addr.company || "",
          contactPhone: "",
          website: "",
          hours: "",
          notes: "",
        }));
        setStops(newStops);
      } else if (extracted.pickup_date || extracted.delivery_date) {
        setStops(prev => prev.map((stop, idx) => ({
          ...stop,
          scheduledDate: idx === 0 ? (extracted.pickup_date || "") : (extracted.delivery_date || "")
        })));
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
        contactName: "",
        contactPhone: "",
        website: "",
        hours: "",
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
      const data = await apiFetch("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: newBrokerName.trim(),
          type: "broker",
          email: "", // Optional but might be required
          phone: "", // Optional but might be required
        }),
      });
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
      const safeParseFloat = (val: string | number | undefined, fallback: number | null = 0) => {
        if (val === undefined || val === null || val === '') return fallback;
        const parsed = parseFloat(val.toString());
        return isNaN(parsed) ? fallback : parsed;
      };

      const safeParseInt = (val: string | number | undefined, fallback: number | null = null) => {
        if (val === undefined || val === null || val === '') return fallback;
        const parsed = parseInt(val.toString());
        return isNaN(parsed) ? fallback : parsed;
      };

      const pickupStop = stops.find(s => s.type === 'pickup') || stops[0] || { address: '', city: '' };
      const deliveryStop = [...stops].reverse().find(s => s.type === 'delivery') || stops[stops.length - 1] || { address: '', city: '' };

      const payload = {
        load_number: String(form.loadNumber || ""),
        status: String(form.status || "Created"),
        driver_id: safeParseInt(form.driverId),
        customer_id: safeParseInt(form.brokerId),
        po_number: String(form.poNumber || ""),
        rate_amount: safeParseFloat(form.rateAmount),
        notes: String(form.notes || ""),
        pickup_address: String(pickupStop.address || pickupStop.city || "Pending").trim(),
        delivery_address: String(deliveryStop.address || deliveryStop.city || "Pending").trim(),
        stops: stops.map((stop, idx) => ({
          stop_number: idx + 1,
          stop_type: stop.type || "pickup",
          company: stop.contactName || "",
          address: stop.address || "",
          city: stop.city || "",
          state: stop.state || "",
          zip_code: stop.zip || "",
          date: stop.scheduledDate || null,
          time: null,
          phone: stop.contactPhone || "",
          website: stop.website || "",
          hours: stop.hours || "",
          notes: stop.notes || "",
        })),
        load_type: String(form.loadType || "Full"),
        weight: safeParseFloat(form.weight, null),
        pallets: safeParseInt(form.pallets),
        length_ft: safeParseFloat(form.lengthFt, null),
        rate_amount: safeParseFloat(form.rateAmount),
        fuel_surcharge: safeParseFloat(form.fuelSurcharge),
        detention: safeParseFloat(form.detention),
        layover: safeParseFloat(form.layover),
        lumper: safeParseFloat(form.lumper),
        other_fees: safeParseFloat(form.otherFees),
        rc_document: form.rcDocument,
        truck_id: form.truckId ? parseInt(form.truckId) : null,
        trailer_id: form.trailerId ? parseInt(form.trailerId) : null,
        broker_name: form.brokerName,
        po_number: form.poNumber,
        customer_id: form.brokerId ? parseInt(form.brokerId) : null,
      };

      console.log("Submitting load payload:", payload);

      if (editLoad) {
        await apiFetch(`/loads/${editLoad.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/loads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

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
          <h2 className="text-2xl font-bold">{editLoad ? `Edit Load: ${editLoad.load_number || editLoad.id}` : "Create New Load"}</h2>
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Load Information</h3>
                    {viewMode === "manual" && !uploadedFileUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary h-8"
                        onClick={() => document.getElementById("rate-con-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Rate Con
                      </Button>
                    )}
                  </div>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Load Type</label>
                      <select
                        value={form.loadType}
                        onChange={(e) => setForm({ ...form, loadType: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="Full">Full</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Weight</label>
                      <input
                        type="number"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        placeholder="Lbs"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Pallets</label>
                      <input
                        type="number"
                        value={form.pallets}
                        onChange={(e) => setForm({ ...form, pallets: e.target.value })}
                        placeholder="Qty"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Length (ft)</label>
                      <input
                        type="number"
                        value={form.lengthFt}
                        onChange={(e) => setForm({ ...form, lengthFt: e.target.value })}
                        placeholder="Feet"
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border mt-4">
                    <div>
                      <label className="text-sm font-medium">Fuel Surcharge ($)</label>
                      <input
                        type="number"
                        value={form.fuelSurcharge}
                        onChange={(e) => setForm({ ...form, fuelSurcharge: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Detention ($)</label>
                      <input
                        type="number"
                        value={form.detention}
                        onChange={(e) => setForm({ ...form, detention: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Layover ($)</label>
                      <input
                        type="number"
                        value={form.layover}
                        onChange={(e) => setForm({ ...form, layover: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Lumper ($)</label>
                      <input
                        type="number"
                        value={form.lumper}
                        onChange={(e) => setForm({ ...form, lumper: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Other Fees ($)</label>
                      <input
                        type="number"
                        value={form.otherFees}
                        onChange={(e) => setForm({ ...form, otherFees: e.target.value })}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Truck
                      </label>
                      <select
                        value={form.truckId}
                        onChange={(e) => setForm({ ...form, truckId: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="">Select Truck</option>
                        {equipment.filter(e => e.equipment_type === 'truck').map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.identifier}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Trailer
                      </label>
                      <select
                        value={form.trailerId}
                        onChange={(e) => setForm({ ...form, trailerId: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="">Select Trailer</option>
                        {equipment.filter(e => e.equipment_type === 'trailer').map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.identifier}
                          </option>
                        ))}
                      </select>
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
                        className={`border border-border rounded-lg p-4 bg-muted/30 cursor-move hover:bg-muted/50 transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''
                          } ${draggedIndex !== null && draggedIndex !== index ? 'border-dashed border-2' : ''}`}
                        onClick={() => {
                          setEditingStopIndex(index);
                          setShowEditStopModal(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${stop.type === "pickup"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                                  }`}>
                                  {stop.type === "pickup" ? "📦" : "🚚"} {stop.type.toUpperCase()} #{index + 1}
                                </span>
                                {stop.scheduledDate && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(stop.scheduledDate).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeStop(stop.id);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="text-sm space-y-1">
                              <div className="font-medium text-foreground">
                                {stop.address || <span className="text-muted-foreground italic">No address</span>}
                              </div>
                              {(stop.city || stop.state || stop.zip) && (
                                <div className="text-muted-foreground">
                                  {[stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}
                                </div>
                              )}
                              {stop.contactName && (
                                <div className="text-muted-foreground">
                                  👤 {stop.contactName} {stop.contactPhone && `• ${stop.contactPhone}`}
                                </div>
                              )}
                              {stop.notes && (
                                <div className="text-xs text-muted-foreground mt-1 p-2 bg-background/50 rounded">
                                  {stop.notes}
                                </div>
                              )}
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
                    {creating ? (editLoad ? "Updating..." : "Creating...") : (editLoad ? "Update Load" : "Create Load")}
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

        {/* Edit Stop Modal - Large Modal for Better Overview */}
        {showEditStopModal && editingStopIndex !== null && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditStopModal(false)}>
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold">Edit Stop</h3>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${stops[editingStopIndex].type === "pickup"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                      {stops[editingStopIndex].type === "pickup" ? "📦" : "🚚"} {stops[editingStopIndex].type.toUpperCase()} #{editingStopIndex + 1}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditStopModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Stop Type Toggle */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Stop Type</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={stops[editingStopIndex].type === "pickup" ? "default" : "outline"}
                        onClick={() => updateStop(stops[editingStopIndex].id, "type", "pickup")}
                        className="flex-1"
                      >
                        📦 Pickup
                      </Button>
                      <Button
                        type="button"
                        variant={stops[editingStopIndex].type === "delivery" ? "default" : "outline"}
                        onClick={() => updateStop(stops[editingStopIndex].id, "type", "delivery")}
                        className="flex-1"
                      >
                        🚚 Delivery
                      </Button>
                    </div>
                  </div>

                  {/* Company/Location Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Company / Location Name</label>
                    <input
                      type="text"
                      placeholder="e.g., ExtraSpace Storage, Walmart DC"
                      value={stops[editingStopIndex].contactName}
                      onChange={(e) => updateStop(stops[editingStopIndex].id, "contactName", e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                    />
                  </div>

                  {/* Address with Autocomplete */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address *</label>
                    <AddressAutocomplete
                      value={stops[editingStopIndex].address}
                      onChange={(value, details) => {
                        const stopId = stops[editingStopIndex].id;
                        updateStop(stopId, "address", value);
                        
                        // Auto-fill details from autocomplete selection
                        if (details?.title) updateStop(stopId, "contactName", details.title);
                        if (details?.phone) updateStop(stopId, "contactPhone", details.phone);
                        if (details?.website) updateStop(stopId, "website", details.website);
                        if (details?.hours) updateStop(stopId, "hours", details.hours);
                      }}
                      placeholder="Start typing address for suggestions..."
                      className="text-base"
                      onCityStateZip={(city, state, zip) => {
                        const stopId = stops[editingStopIndex].id;
                        if (city) updateStop(stopId, "city", city);
                        if (state) updateStop(stopId, "state", state);
                        if (zip) updateStop(stopId, "zip", zip);
                      }}
                    />
                  </div>

                  {/* City, State, ZIP Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={stops[editingStopIndex].city}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "city", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={stops[editingStopIndex].state}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "state", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={stops[editingStopIndex].zip}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "zip", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                  </div>

                  {/* Date and Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Scheduled Date & Time</label>
                      <input
                        type="datetime-local"
                        value={stops[editingStopIndex].scheduledDate}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "scheduledDate", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={stops[editingStopIndex].contactPhone}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "contactPhone", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Website</label>
                      <input
                        type="text"
                        placeholder="Company Website"
                        value={stops[editingStopIndex].website}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "website", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Hours of Operation</label>
                      <input
                        type="text"
                        placeholder="e.g., 8AM - 5PM"
                        value={stops[editingStopIndex].hours}
                        onChange={(e) => updateStop(stops[editingStopIndex].id, "hours", e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes / Special Instructions</label>
                    <textarea
                      placeholder="Gate codes, delivery instructions, unit numbers, etc."
                      value={stops[editingStopIndex].notes}
                      onChange={(e) => updateStop(stops[editingStopIndex].id, "notes", e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-base"
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        removeStop(stops[editingStopIndex].id);
                        setShowEditStopModal(false);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Stop
                    </Button>
                    <div className="flex-1"></div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditStopModal(false)}
                      className="min-w-[120px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowEditStopModal(false)}
                      className="min-w-[120px]"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div >
  );
}
