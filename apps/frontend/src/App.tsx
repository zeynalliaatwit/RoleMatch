// apps/frontend/src/App.tsx
import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HealthResponse {
  status: string;
  message: string;
}

function App() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetching from your Node.js backend server
    fetch('http://localhost:5000/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((jsonData: HealthResponse) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '2.5rem', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>RoleMatch</h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Capstone Integration Testing Dashboard</p>

        {loading && (
          <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Activity className="animate-spin" /> Ping Server...
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle /> <strong>Connection Failure:</strong> {error}
          </div>
        )}

        {data && (
          <div>
            <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1rem', fontSize: '1.25rem' }}>
              <CheckCircle2 /> <strong>Status: {data.status.toUpperCase()}</strong>
            </div>
            <p style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '8px', margin: 0 }}>
              {data.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;