'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { updateUserRole, addNewUser, updateSubscriptionDays } from './actions'

export default function UsersClient({ users, initialSearch, initialFilter }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [filter, setFilter] = useState(initialFilter || 'all')
  const [daysInput, setDaysInput] = useState({})

  // Debounce search and filter
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (searchQuery) {
        params.set('q', searchQuery)
      } else {
        params.delete('q')
      }
      
      if (filter !== 'all') {
        params.set('filter', filter)
      } else {
        params.delete('filter')
      }

      router.replace(`${pathname}?${params.toString()}`)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, filter, pathname, router, searchParams])

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

  async function handleUpdateDays(userId) {
    const days = daysInput[userId];
    if (!days) return;

    setLoading(userId)
    const res = await updateSubscriptionDays(userId, days)
    if (res?.error) {
      alert("Error: " + res.error)
    } else {
      alert(`Successfully updated subscription days!`)
      setDaysInput(prev => ({ ...prev, [userId]: '' }))
    }
    setLoading(null)
  }

  function getDaysLeft(endDateString) {
    if (!endDateString) return null;
    const end = new Date(endDateString);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search all database users by email or username..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 300px', maxWidth: '400px', padding: '12px 15px', background: 'var(--bg2)', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
        />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '12px 15px', background: 'var(--bg2)', border: '1px solid #333', color: '#fff', borderRadius: '6px', minWidth: '150px' }}
        >
          <option value="all">All Users</option>
          <option value="active">Active Subscriptions</option>
          <option value="expired">Expired Subscriptions</option>
        </select>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#333', borderBottom: '1px solid #444' }}>
              <th style={{ padding: '15px', fontSize: '14px' }}>Email</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Username</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Role</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Subscription Ends</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Add/Remove Days</th>
              <th style={{ padding: '15px', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const hasSub = u.subscription_end_date && new Date(u.subscription_end_date) > new Date();
              const daysLeft = getDaysLeft(u.subscription_end_date);
              
              return (
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
                  <td style={{ padding: '15px', fontSize: '14px', color: hasSub ? '#4CAF50' : 'var(--text2)' }}>
                    {u.subscription_end_date ? (
                      <div>
                        {new Date(u.subscription_end_date).toLocaleDateString()}
                        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                          {daysLeft > 0 ? `(${daysLeft} days left)` : '(Expired)'}
                        </div>
                      </div>
                    ) : 'None'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="number" 
                        placeholder="+/- days" 
                        value={daysInput[u.id] || ''}
                        onChange={(e) => setDaysInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                        style={{ width: '80px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                      <button 
                        onClick={() => handleUpdateDays(u.id)}
                        disabled={loading === u.id || !daysInput[u.id]}
                        style={{ padding: '6px 12px', background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Apply
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: 'var(--text2)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <Link 
                        href={`/admin/users/${u.id}`}
                        style={{ padding: '6px 12px', background: '#333', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '12px', display: 'inline-block' }}
                      >
                        View Activity
                      </Link>
                      {loading === u.id ? 'Updating...' : ''}
                    </div>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text2)' }}>
                  No users found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
