'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/admin-api';
import { getUser } from '../../lib/auth';
import { Shield, Plus, UserCircle, MapPin, X, Save } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'FIELD_WORKER',
    district: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUsername(getUser()?.username || null);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.get('/auth/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('User list could not be loaded. Confirm the backend is running on http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingUserId) {
        await adminApi.put(`/auth/users/${editingUserId}`, {
          full_name: formData.full_name,
          role: formData.role,
          district: formData.district
        });
        setSuccess('User updated successfully!');
      } else {
        await adminApi.post('/auth/register', formData);
        setSuccess('User created successfully!');
      }
      
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
        setEditingUserId(null);
        setFormData({
          username: '',
          password: '',
          full_name: '',
          role: 'FIELD_WORKER',
          district: ''
        });
      }, 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to save user');
    }
  };

  const changeActive = async (user: any, active: boolean) => {
    const name = user.full_name || user.username;
    const prompt = active
      ? `Activate ${name}? They will be able to sign in again.`
      : `Deactivate ${name}? They will not be able to sign in.`;
    if (!window.confirm(prompt)) return;
    setActionError('');
    try {
      await adminApi.patch(`/auth/users/${user.id}/active`, { is_active: active });
      await fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'The account could not be updated.');
    }
  };

  const removeUser = async (user: any) => {
    const name = user.full_name || user.username;
    if (!window.confirm(`Delete ${name} (@${user.username})? This cannot be undone.`)) return;
    setActionError('');
    try {
      await adminApi.delete(`/auth/users/${user.id}`);
      await fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'The account could not be deleted.');
    }
  };

  const roleColors: Record<string, string> = {
    'FIELD_WORKER': '#10b981',
    'LEVEL_1_FIELD_WORKER': '#10b981',
    'DISTRICT_ADMIN': '#38bdf8',
    'LEVEL_2_DISTRICT_ADMIN': '#38bdf8',
    'SYSTEM_ADMIN': '#c084fc',
    'LEVEL_3_SYSTEM_ADMIN': '#c084fc',
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={28} color="#c084fc" />
            <span>User & Role Management</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
            Manage District Admins, Field Workers, and system access levels
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setEditingUserId(null);
            setFormData({
              username: '',
              password: '',
              full_name: '',
              role: 'FIELD_WORKER',
              district: ''
            });
            setIsModalOpen(true);
          }}
          style={{ padding: '0.6rem 1.2rem' }}
        >
          <Plus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      {actionError && (
        <p style={{ color: '#fda4af', marginBottom: '1rem' }}>{actionError}</p>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>District</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: error ? '#fda4af' : 'var(--text-secondary)' }}>
                  {error || 'No users found.'}
                </td>
              </tr>
            ) : users.map(u => {
              const active = u.is_active !== false;
              const isSelf = u.username === currentUsername;
              return (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: active ? 1 : 0.72 }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: 'var(--surface-color)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <UserCircle size={20} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span 
                    className="badge"
                    style={{ 
                      background: `rgba(${roleColors[u.role] === '#10b981' ? '16, 185, 129' : roleColors[u.role] === '#38bdf8' ? '56, 189, 248' : '192, 132, 252'}, 0.15)`,
                      color: roleColors[u.role] || '#94a3b8',
                      border: `1px solid ${roleColors[u.role]}40`
                    }}
                  >
                    {(u.role || '').replaceAll('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} />
                    <span>{u.district || 'All Districts'}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge" style={{
                    background: active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 113, 133, 0.15)',
                    color: active ? '#6ee7b7' : '#fda4af',
                    border: `1px solid ${active ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 113, 133, 0.45)'}`,
                  }}>
                    {active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: '44px' }}
                      onClick={() => {
                        setEditingUserId(u.id);
                        setFormData({
                          username: u.username,
                          password: '',
                          full_name: u.full_name,
                          role: u.role,
                          district: u.district || ''
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    {!isSelf && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: '44px', color: active ? '#fde68a' : '#6ee7b7' }}
                        onClick={() => changeActive(u, !active)}
                      >
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {!isSelf && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: '44px', color: '#fda4af' }}
                        onClick={() => removeUser(u)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingUserId ? 'Edit User' : 'Add New User'}
            </h3>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  placeholder="e.g. Ramesh Kumar" 
                />
              </div>

              {!editingUserId && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Username</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      required
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      placeholder="e.g. ramesh.kumar" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••" 
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Role</label>
                <select 
                  className="input-field"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="FIELD_WORKER">Field Worker</option>
                  <option value="DISTRICT_ADMIN">District Admin</option>
                  <option value="SYSTEM_ADMIN">System Admin</option>
                </select>
              </div>

              {formData.role !== 'SYSTEM_ADMIN' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>District</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    required
                    value={formData.district}
                    onChange={e => setFormData({...formData, district: e.target.value})}
                    placeholder="e.g. South Delhi" 
                  />
                </div>
              )}

              {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{success}</div>}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <Save size={16} /> Save User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
