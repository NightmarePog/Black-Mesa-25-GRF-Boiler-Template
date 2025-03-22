import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin_page_login_background.css';

const AdminLogin: React.FC = () => {
    const [adminName, setAdminName] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: adminName,
                    password: adminPassword
                }),
            });

            if (response.ok) {
                localStorage.setItem('admin', 'true');
                navigate('/admin');
            } else {
                const data = await response.json();
                setError(data.error || 'Neplatné přihlašovací údaje');
            }
        } catch (err) {
            setError('Chyba připojení k serveru');
        }
    };

    return (
        <div className="centered-square">
            <div className="content">
                <h2>Admin <br /> Přihlášení</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Jméno"
                        required
                    />
                    <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Heslo"
                        required
                    />
                    {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
                    <button type="submit">Přihlásit se</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;