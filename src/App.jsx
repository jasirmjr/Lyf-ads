import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Connecting to backend...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setMessage(data.message + " DB Time: " + data.time);
        } else {
          setMessage('Failed to connect to DB: ' + data.error);
        }
      })
      .catch(() => setMessage('Could not reach backend.'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>My Vercel Fullstack App</h1>
      <p style={{ fontSize: '1.2rem', color: '#0070f3' }}>{message}</p>
    </div>
  );
}

export default App;