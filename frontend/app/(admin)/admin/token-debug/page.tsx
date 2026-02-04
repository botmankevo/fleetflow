'use client';

import { useEffect, useState } from 'react';

export default function TokenDebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('fleetflow_token');
    
    if (token) {
      try {
        // Decode JWT token
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        setTokenInfo({
          raw: token.substring(0, 50) + '...',
          payload: payload,
          carrier_id: payload.carrier_id,
          role: payload.role,
          email: payload.email || payload.sub,
          exp: new Date(payload.exp * 1000).toLocaleString()
        });
      } catch (e) {
        setTokenInfo({ error: 'Failed to decode token' });
      }
    } else {
      setTokenInfo({ error: 'No token found' });
    }
  }, []);

  return (
    <div style={{ padding: '20px', background: '#1e1e1e', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#0abf53' }}>🔍 Token Debug Page</h1>
      
      {!tokenInfo ? (
        <p>Loading...</p>
      ) : tokenInfo.error ? (
        <div style={{ background: '#5c1a1a', padding: '20px', borderRadius: '8px', border: '2px solid #f44336' }}>
          <h2 style={{ color: '#f44336' }}>❌ {tokenInfo.error}</h2>
        </div>
      ) : (
        <div style={{ background: '#2d2d2d', padding: '20px', borderRadius: '8px', border: '1px solid #4caf50' }}>
          <h2 style={{ color: '#4caf50' }}>✅ Token Found</h2>
          
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#61dafb' }}>Token Claims:</h3>
            
            <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '4px', marginTop: '10px' }}>
              <p><strong style={{ color: '#4caf50' }}>Email/Subject:</strong> <span style={{ color: '#ffeb3b' }}>{tokenInfo.email}</span></p>
              <p><strong style={{ color: '#4caf50' }}>Role:</strong> <span style={{ color: '#ffeb3b' }}>{tokenInfo.role}</span></p>
              <p><strong style={{ color: '#4caf50' }}>Carrier ID:</strong> <span style={{ color: '#ffeb3b', fontSize: '20px', fontWeight: 'bold' }}>{tokenInfo.carrier_id || 'MISSING!'}</span></p>
              <p><strong style={{ color: '#4caf50' }}>Expires:</strong> <span style={{ color: '#ffeb3b' }}>{tokenInfo.exp}</span></p>
            </div>
            
            <h3 style={{ color: '#61dafb', marginTop: '30px' }}>Full Token Payload:</h3>
            <pre style={{ background: '#282c34', color: '#abb2bf', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(tokenInfo.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#1a237e', borderRadius: '8px', border: '1px solid #3f51b5' }}>
        <h3 style={{ color: '#82b1ff' }}>💡 What to Check:</h3>
        <ul style={{ color: '#b3d4ff' }}>
          <li><strong>carrier_id:</strong> Must be 2 (that's where the loads are)</li>
          <li><strong>role:</strong> Should be "admin" or similar</li>
          <li><strong>If carrier_id is wrong:</strong> Logout and login again</li>
        </ul>
      </div>
    </div>
  );
}
