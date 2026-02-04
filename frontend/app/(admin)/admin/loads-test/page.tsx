'use client';

import { useEffect, useState } from 'react';

export default function LoadsTestPage() {
  const [loads, setLoads] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        addLog('🔍 Starting fetch...');
        
        const token = localStorage.getItem('fleetflow_token'); // Fixed: correct key
        addLog(`🔑 Token: ${token ? 'EXISTS (' + token.substring(0, 20) + '...)' : '❌ MISSING'}`);
        
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
        const url = `${apiBase}/loads`;
        addLog(`📡 Fetching from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        addLog(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          addLog(`✅ SUCCESS! Received ${data.length} loads`);
          addLog(`📦 Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
          addLog(`📦 Raw data: ${JSON.stringify(data).substring(0, 200)}...`);
          setLoads(Array.isArray(data) ? data : []);
        } else {
          const errorText = await response.text();
          addLog(`❌ Error response: ${errorText}`);
          setError(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (err: any) {
        addLog(`❌ Fetch error: ${err.message}`);
        setError(err.message);
      } finally {
        setLoading(false);
        addLog('✅ Fetch complete');
      }
    };

    fetchLoads();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#1e1e1e', color: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ color: '#0abf53' }}>🔍 Load API Test Page</h1>
      
      <div style={{ background: '#2d2d2d', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #444' }}>
        <h2 style={{ color: '#61dafb', marginTop: 0 }}>📋 Logs:</h2>
        {logs.map((log, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #444', color: '#e0e0e0', fontSize: '14px' }}>
            {log}
          </div>
        ))}
      </div>
      
      {loading && <p style={{ fontSize: '18px', color: '#ffeb3b' }}>⏳ Loading...</p>}
      
      {error && (
        <div style={{ background: '#5c1a1a', padding: '15px', border: '2px solid #f44336', borderRadius: '8px', marginBottom: '20px', color: '#ffcdd2' }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}
      
      {!loading && !error && (
        <div style={{ background: '#1b5e20', padding: '15px', border: '2px solid #4caf50', borderRadius: '8px', color: '#c8e6c9' }}>
          <h2 style={{ color: '#4caf50', marginTop: 0 }}>✅ Success! Loads: {loads.length}</h2>
          
          {loads.length > 0 && (
            <>
              <h3 style={{ color: '#81c784' }}>First Load Sample:</h3>
              <div style={{ background: '#2d2d2d', padding: '15px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #4caf50' }}>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>Load #:</strong> {loads[0].load_number}</p>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>Status:</strong> {loads[0].status}</p>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>Broker:</strong> {loads[0].broker_name}</p>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>Rate:</strong> ${loads[0].broker_rate}</p>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>From:</strong> {loads[0].pickup_city}, {loads[0].pickup_state}</p>
                <p style={{ color: '#e0e0e0', margin: '8px 0' }}><strong style={{ color: '#4caf50' }}>To:</strong> {loads[0].delivery_city}, {loads[0].delivery_state}</p>
              </div>
              
              <details>
                <summary style={{ cursor: 'pointer', padding: '10px', background: '#424242', color: '#fff', borderRadius: '4px', border: '1px solid #666' }}>
                  Show Full JSON Response (click to expand)
                </summary>
                <pre style={{ background: '#282c34', color: '#abb2bf', padding: '15px', overflow: 'auto', borderRadius: '4px', marginTop: '10px' }}>
                  {JSON.stringify(loads, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#1a237e', borderRadius: '8px', border: '1px solid #3f51b5' }}>
        <h3 style={{ color: '#82b1ff', marginTop: 0 }}>💡 Troubleshooting Guide:</h3>
        <ul style={{ color: '#b3d4ff' }}>
          <li>✅ Backend API: <a href="http://localhost:8000/docs" target="_blank" style={{ color: '#64b5f6' }}>http://localhost:8000/docs</a></li>
          <li>✅ If you see loads above, the API works!</li>
          <li>❌ If 401 error: Token expired, logout and login again</li>
          <li>❌ If network error: Check if backend is running</li>
          <li>❌ If CORS error: Check browser console</li>
        </ul>
      </div>
    </div>
  );
}
