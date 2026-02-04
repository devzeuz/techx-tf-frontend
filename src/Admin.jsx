import React, { useState } from 'react';
import { apiRequest } from './Api';
import { useNavigate } from 'react-router-dom';

const Admin = ({ user }) => {
    const [playlist, setPlaylist] = useState('');
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    // The user object from Amplify has a signInUserSession with groups
    // But getting groups cleanly in Amplify Gen 2 can be tricky.
    // We will assume if they accessed this route, they are authorized, 
    // and let the backend (or 403 error) handle rejection.

    const handleImport = async (e) => {
        e.preventDefault();
        setStatus('⏳ Importing... (This may take 30 seconds)');
        
        const result = await apiRequest('/admin/ingest', 'POST', {
            playlistId: playlist,
            courseTitle: title
        });

        if (result && result.message) {
            setStatus('✅ ' + result.message);
            setPlaylist('');
            setTitle('');
        } else {
            setStatus('❌ Error: You might not be an Admin, or the Playlist ID is invalid.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Admin Dashboard</h2>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid #ccc', color: "white", padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Back</button>
            </div>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>Only authorized Admins can import new content.</p>
            
            <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="text" 
                    placeholder="Course Title" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <input 
                    type="text" 
                    placeholder="YouTube Playlist ID" 
                    value={playlist}
                    onChange={e => setPlaylist(e.target.value)}
                    required
                    style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <button 
                    type="submit" 
                    style={{ padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Import Course
                </button>
            </form>
            {status && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{status}</p>}
        </div>
    );
};

export default Admin;