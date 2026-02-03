"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketContextType {
    status: ConnectionStatus;
    subscribe: (channel: string, callback: (data: unknown) => void) => () => void;
    send: (channel: string, data: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within WebSocketProvider");
    }
    return context;
}

interface WebSocketProviderProps {
    children: React.ReactNode;
    url?: string;
    enabled?: boolean;
}

export function WebSocketProvider({
    children,
    url = "ws://localhost:8000/ws",
    enabled = false // Disabled by default until backend is ready
}: WebSocketProviderProps) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [subscribers, setSubscribers] = useState<Map<string, Set<(data: unknown) => void>>>(new Map());

    const connect = useCallback(() => {
        if (!enabled) {
            setStatus("disconnected");
            return;
        }

        try {
            setStatus("connecting");
            const socket = new WebSocket(url);

            socket.onopen = () => {
                console.log("[WebSocket] Connected");
                setStatus("connected");
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const { channel, data } = message;

                    // Notify all subscribers for this channel
                    const channelSubscribers = subscribers.get(channel);
                    if (channelSubscribers) {
                        channelSubscribers.forEach(callback => callback(data));
                    }
                } catch (error) {
                    console.error("[WebSocket] Message parse error:", error);
                }
            };

            socket.onerror = (error) => {
                console.error("[WebSocket] Error:", error);
                setStatus("error");
            };

            socket.onclose = () => {
                console.log("[WebSocket] Disconnected");
                setStatus("disconnected");

                // Attempt reconnection after 5 seconds
                if (enabled) {
                    setTimeout(connect, 5000);
                }
            };

            setWs(socket);
        } catch (error) {
            console.error("[WebSocket] Connection error:", error);
            setStatus("error");
        }
    }, [url, enabled, subscribers]);

    useEffect(() => {
        connect();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [connect, ws]);

    const subscribe = useCallback((channel: string, callback: (data: unknown) => void) => {
        setSubscribers(prev => {
            const newMap = new Map(prev);
            const channelSubs = newMap.get(channel) || new Set();
            channelSubs.add(callback);
            newMap.set(channel, channelSubs);
            return newMap;
        });

        // Return unsubscribe function
        return () => {
            setSubscribers(prev => {
                const newMap = new Map(prev);
                const channelSubs = newMap.get(channel);
                if (channelSubs) {
                    channelSubs.delete(callback);
                    if (channelSubs.size === 0) {
                        newMap.delete(channel);
                    } else {
                        newMap.set(channel, channelSubs);
                    }
                }
                return newMap;
            });
        };
    }, []);

    const send = useCallback((channel: string, data: unknown) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ channel, data }));
        } else {
            console.warn("[WebSocket] Cannot send - not connected");
        }
    }, [ws]);

    return (
        <WebSocketContext.Provider value={{ status, subscribe, send }}>
            {children}
        </WebSocketContext.Provider>
    );
}
