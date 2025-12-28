export default function HealthCheck() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            background: '#09090b',
            color: 'white',
            fontFamily: 'monospace'
        }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ Server is Running</h1>
            <p style={{ fontSize: '20px', color: '#a1a1aa' }}>Deployment Time: {new Date().toISOString()}</p>
            <p style={{ fontSize: '16px', color: '#71717a', marginTop: '40px' }}>
                If you see this, the Next.js app is working correctly.
            </p>
        </div>
    );
}
