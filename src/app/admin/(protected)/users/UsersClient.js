'use client'

import { useState } from 'react'
import { updateUserRole, addNewUser } from './actions'

export default function UsersClient({ users }) {
  const [loading, setLoading] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [error, setError] = useState(null)

  async function handleRoleChange(userId, newRole) {
    setLoading(userId)
    const res = await updateUserRole(userId, newRole)
    if (res?.error) {
      alert("Error: " + res.error)
    }
    setLoading(null)
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setAddingUser(true)
    setError(null)

    const formData = new FormData(e.target)
    const res = await addNewUser(formData)
    
    if (res?.error) {
      setError(res.error)
    } else {
      e.target.reset()
      alert("User added successfully!")
    }
    setAddingUser(false)
  }

  return (
    <div>
      <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)' }}>Add New User</h3>
        {error && <div style={{ color: '#e50914', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Email</label>
            <input type="email" name="email" required style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Password</label>
            <input type="password" name="password" required style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Role</label>
            <select name="role" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}>
              <option value="user">User</option>
              <option value="editor">Editor</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          <button type="submit" disabled={addingUser} className="gms-btn gms-btn--primary" style={{ padding: '10px 20px', height: '40px' }}>
            {addingUser ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#333', borderBottom: '1px solid #444' }}>
              <th style={{ padding: '15px', fontSize: '14px' }}>Email</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Username</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Role</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px', fontSize: '14px' }}>{u.email}</td>
                <td style={{ padding: '15px', fontSize: '14px', color: 'var(--text2)' }}>{u.username || '-'}</td>
                <td style={{ padding: '15px' }}>
                  <select 
                    value={u.role || 'user'} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={loading === u.id}
                    style={{ padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </td>
                <td style={{ padding: '15px', fontSize: '13px', color: 'var(--text2)' }}>
                  {loading === u.id ? 'Updating...' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
