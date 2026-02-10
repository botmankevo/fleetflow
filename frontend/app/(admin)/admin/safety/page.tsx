"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SafetyEvent {
    id: number;
    driver_id?: number;
    equipment_id?: number;
    event_type: string;
    event_date: string;
    severity: string;
    description: string;
    location?: string;
    citation_number?: string;
    points: number;
    fine_amount?: number;
    status: string;
    resolution_notes?: string;
    resolved_at?: string;
}

interface SafetyStats {
    total_events: number;
    open_events: number;
    accidents: number;
    violations: number;
    inspections: number;
}

export default function SafetyCompliance() {
    const [events, setEvents] = useState<SafetyEvent[]>([]);
    const [stats, setStats] = useState<SafetyStats | null>(null);
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    
    const [newEvent, setNewEvent] = useState({
        event_type: "violation",
        event_date: new Date().toISOString().split('T')[0],
        severity: "medium",
        description: "",
        location: "",
        citation_number: "",
        points: 0,
        fine_amount: 0
    });

    useEffect(() => {
        loadEvents();
        loadStats();
    }, [filterType, filterStatus]);

    const loadEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            let url = "http://localhost:8000/safety/events?limit=100";
            if (filterType !== "all") url += `&event_type=${filterType}`;
            if (filterStatus !== "all") url += `&status=${filterStatus}`;
            
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setEvents(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load safety events:", error);
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/safety/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to load safety stats:", error);
        }
    };

    const createEvent = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/safety/events", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...newEvent,
                    event_date: new Date(newEvent.event_date).toISOString()
                })
            });
            if (response.ok) {
                setShowNewEventModal(false);
                loadEvents();
                loadStats();
                setNewEvent({
                    event_type: "violation",
                    event_date: new Date().toISOString().split('T')[0],
                    severity: "medium",
                    description: "",
                    location: "",
                    citation_number: "",
                    points: 0,
                    fine_amount: 0
                });
            }
        } catch (error) {
            console.error("Failed to create event:", error);
        }
    };

    const updateEventStatus = async (eventId: number, status: string, notes?: string) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/safety/events/${eventId}?status=${status}${notes ? `&resolution_notes=${encodeURIComponent(notes)}` : ''}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadEvents();
            loadStats();
            setSelectedEvent(null);
        } catch (error) {
            console.error("Failed to update event:", error);
        }
    };

    const deleteEvent = async (eventId: number) => {
        if (!confirm("Delete this safety event?")) return;
        
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:8000/safety/events/${eventId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            loadEvents();
            loadStats();
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "bg-red-100 text-red-700";
            case "high": return "bg-orange-100 text-orange-700";
            case "medium": return "bg-yellow-100 text-yellow-700";
            case "low": return "bg-green-100 text-green-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case "accident": return "🚨";
            case "violation": return "⚠️";
            case "inspection": return "🔍";
            case "citation": return "📋";
            default: return "📌";
        }
    };

    if (loading) {
        return (
            <div className="p-8 bg-slate-50 min-h-screen">
                <div className="text-center py-12">Loading safety data...</div>
            </div>
        );
    }

    return (
        <main className="p-8 bg-slate-50 min-h-screen space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Safety & Compliance</h1>
                    <p className="text-slate-500 mt-1">Track safety events, violations, and driver compliance</p>
                </div>
                <Button onClick={() => setShowNewEventModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    + Report Safety Event
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Total Events</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_events}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Open Events</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">{stats.open_events}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Accidents</div>
                        <div className="text-2xl font-bold text-orange-600 mt-1">{stats.accidents}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Violations</div>
                        <div className="text-2xl font-bold text-amber-600 mt-1">{stats.violations}</div>
                    </Card>
                    <Card className="p-6">
                        <div className="text-sm text-slate-500">Inspections</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{stats.inspections}</div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Event Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border rounded-lg p-2 pr-8"
                        >
                            <option value="all">All Types</option>
                            <option value="accident">Accidents</option>
                            <option value="violation">Violations</option>
                            <option value="inspection">Inspections</option>
                            <option value="citation">Citations</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border rounded-lg p-2 pr-8"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="resolved">Resolved</option>
                            <option value="contested">Contested</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Events List */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Safety Events</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium">Type</th>
                                <th className="text-left p-3 text-sm font-medium">Date</th>
                                <th className="text-left p-3 text-sm font-medium">Description</th>
                                <th className="text-left p-3 text-sm font-medium">Location</th>
                                <th className="text-center p-3 text-sm font-medium">Severity</th>
                                <th className="text-center p-3 text-sm font-medium">Points</th>
                                <th className="text-right p-3 text-sm font-medium">Fine</th>
                                <th className="text-center p-3 text-sm font-medium">Status</th>
                                <th className="text-center p-3 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id} className="border-t hover:bg-slate-50">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{getEventTypeIcon(event.event_type)}</span>
                                            <span className="text-sm capitalize">{event.event_type}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {new Date(event.event_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-sm max-w-xs truncate">{event.description}</td>
                                    <td className="p-3 text-sm text-slate-500">{event.location || '-'}</td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(event.severity)}`}>
                                            {event.severity}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-sm font-medium">{event.points}</td>
                                    <td className="p-3 text-right text-sm">
                                        {event.fine_amount ? `$${event.fine_amount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            event.status === 'open' ? 'bg-red-100 text-red-700' :
                                            event.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="text-blue-600 hover:text-blue-700 text-sm mr-2"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(event.id)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {events.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <div className="text-4xl mb-4">🛡️</div>
                            <p>No safety events found. Great job keeping things safe!</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* New Event Modal */}
            {showNewEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Report Safety Event</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Event Type</label>
                                <select
                                    value={newEvent.event_type}
                                    onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="violation">Violation</option>
                                    <option value="accident">Accident</option>
                                    <option value="inspection">Inspection</option>
                                    <option value="citation">Citation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Event Date</label>
                                <input
                                    type="date"
                                    value={newEvent.event_date}
                                    onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Severity</label>
                                <select
                                    value={newEvent.severity}
                                    onChange={(e) => setNewEvent({...newEvent, severity: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Points</label>
                                <input
                                    type="number"
                                    value={newEvent.points}
                                    onChange={(e) => setNewEvent({...newEvent, points: Number(e.target.value)})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location (Optional)</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="City, State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Citation # (Optional)</label>
                                <input
                                    type="text"
                                    value={newEvent.citation_number}
                                    onChange={(e) => setNewEvent({...newEvent, citation_number: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fine Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newEvent.fine_amount}
                                    onChange={(e) => setNewEvent({...newEvent, fine_amount: Number(e.target.value)})}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                    placeholder="Describe the incident..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button onClick={createEvent} className="flex-1">Create Event</Button>
                            <Button onClick={() => setShowNewEventModal(false)} variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Safety Event Details</h3>
                                <p className="text-sm text-slate-500">
                                    {getEventTypeIcon(selectedEvent.event_type)} {selectedEvent.event_type.toUpperCase()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-sm text-slate-500">Date</div>
                                <div className="font-medium">{new Date(selectedEvent.event_date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Severity</div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(selectedEvent.severity)}`}>
                                    {selectedEvent.severity}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Points</div>
                                <div className="font-medium">{selectedEvent.points}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Fine Amount</div>
                                <div className="font-medium">
                                    {selectedEvent.fine_amount ? `$${selectedEvent.fine_amount.toFixed(2)}` : 'N/A'}
                                </div>
                            </div>
                            {selectedEvent.location && (
                                <div className="col-span-2">
                                    <div className="text-sm text-slate-500">Location</div>
                                    <div className="font-medium">{selectedEvent.location}</div>
                                </div>
                            )}
                            {selectedEvent.citation_number && (
                                <div className="col-span-2">
                                    <div className="text-sm text-slate-500">Citation Number</div>
                                    <div className="font-medium">{selectedEvent.citation_number}</div>
                                </div>
                            )}
                            <div className="col-span-2">
                                <div className="text-sm text-slate-500">Description</div>
                                <div className="font-medium mt-1">{selectedEvent.description}</div>
                            </div>
                            {selectedEvent.resolution_notes && (
                                <div className="col-span-2">
                                    <div className="text-sm text-slate-500">Resolution Notes</div>
                                    <div className="font-medium mt-1">{selectedEvent.resolution_notes}</div>
                                </div>
                            )}
                        </div>

                        {selectedEvent.status === 'open' && (
                            <div className="flex gap-2 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        const notes = prompt("Add resolution notes:");
                                        if (notes !== null) {
                                            updateEventStatus(selectedEvent.id, 'resolved', notes);
                                        }
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Mark as Resolved
                                </Button>
                                <Button
                                    onClick={() => updateEventStatus(selectedEvent.id, 'contested')}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Contest Event
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </main>
    );
}
