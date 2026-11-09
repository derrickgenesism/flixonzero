'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { updateUserRole, addNewUser, updateSubscriptionDays } from './actions'

function formatTimeAgo(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function UsersClient({ users, stats = {}, initialSearch, initialFilter }) {
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
    }, 400)

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
      {/* Real-time Activity & User KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div 
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'rgba(255,255,255,0.08)' : 'var(--bg2)',
            padding: '18px 20px', borderRadius: '12px', border: filter === 'all' ? '1px solid var(--acc)' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Total Registered Users</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff' }}>{Number(stats.totalUsers || 0).toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>View all database accounts</div>
        </div>

        <div 
          onClick={() => setFilter('online')}
          style={{
            background: filter === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg2)',
            padding: '18px 20px', borderRadius: '12px', border: filter === 'online' ? '1px solid #10b981' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
            Online Right Now
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981' }}>{stats.onlineNow || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Active in last 30 minutes</div>
        </div>

        <div 
          onClick={() => setFilter('today')}
          style={{
            background: filter === 'today' ? 'rgba(251, 191, 36, 0.15)' : 'var(--bg2)',
            padding: '18px 20px', borderRadius: '12px', border: filter === 'today' ? '1px solid #fbbf24' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>
            🟡 Active Today
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24' }}>{stats.activeToday || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Visited FlixOn today</div>
        </div>

        <div 
          onClick={() => setFilter('active')}
          style={{
            background: filter === 'active' ? 'rgba(74, 222, 128, 0.15)' : 'var(--bg2)',
            padding: '18px 20px', borderRadius: '12px', border: filter === 'active' ? '1px solid #4ade80' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ fontSize: '11px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>
            ⭐ Active Subscribers
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80' }}>{Number(stats.activeSubscribers || 0).toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Currently paid members</div>
        </div>
      </div>

      {/* Add New User Collapsible Card */}
      <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 15px', color: 'var(--acc)', fontSize: '16px' }}>➕ Add New User</h3>
        {error && <div style={{ color: '#e50914', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Email</label>
            <input type="email" name="email" required style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Password</label>
            <input type="password" name="password" required style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Role</label>
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

      {/* Search & Filter Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search users by email or username..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 300px', maxWidth: '420px', padding: '12px 15px', background: 'var(--bg2)', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontSize: '14px' }}
        />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '12px 15px', background: 'var(--bg2)', border: '1px solid #333', color: '#fff', borderRadius: '6px', minWidth: '180px', fontSize: '14px' }}
        >
          <option value="all">All Users</option>
          <option value="online">🟢 Online Now (&lt;30m)</option>
          <option value="today">🟡 Active Today</option>
          <option value="active">⭐ Active Subscriptions</option>
          <option value="expired">Expired Subscriptions</option>
          <option value="frozen">⛔ Frozen Accounts</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text3)' }}>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600' }}>User / Email</th>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600' }}>Activity Status</th>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600' }}>Subscription</th>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600' }}>Adjust Days</th>
              <th style={{ padding: '15px 18px', fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const hasSub = u.subscription_end_date && new Date(u.subscription_end_date) > new Date();
              const daysLeft = getDaysLeft(u.subscription_end_date);
              
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: u.role === 'frozen' ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                  <td style={{ padding: '14px 18px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <Link 
                        href={`/admin/users/${u.id}`}
                        style={{ color: '#fff', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        {u.email}
                        {u.role === 'frozen' && (
                          <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                            FROZEN
                          </span>
                        )}
                      </Link>
                      {u.username && (
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>@{u.username}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {u.isOnline ? (
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                          Online Now
                        </span>
                        {u.lastPath && (
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px', fontFamily: 'monospace', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.lastPath}>
                            {u.lastPath}
                          </div>
                        )}
                      </div>
                    ) : u.isActiveToday ? (
                      <div>
                        <span style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                          Active Today
                        </span>
                        {u.lastActive && (
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>
                            {formatTimeAgo(u.lastActive)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
                        {u.lastActive ? formatTimeAgo(u.lastActive) : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <select 
                      value={u.role || 'user'} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={loading === u.id}
                      style={{
                        padding: '6px 8px',
                        background: u.role === 'frozen' ? 'rgba(239,68,68,0.25)' : '#111',
                        border: u.role === 'frozen' ? '1px solid #ef4444' : '1px solid #333',
                        color: u.role === 'frozen' ? '#ff6b6b' : '#fff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: u.role === 'frozen' ? '700' : 'normal'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="administrator">Administrator</option>
                      <option value="frozen">⛔ Frozen (Blocked)</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: hasSub ? '#4CAF50' : 'var(--text2)' }}>
                    {u.subscription_end_date ? (
                      <div>
                        <strong>{new Date(u.subscription_end_date).toLocaleDateString()}</strong>
                        <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                          {daysLeft > 0 ? `${daysLeft} days left` : '(Expired)'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: '12px' }}>No Pass</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="number" 
                        placeholder="+/-" 
                        value={daysInput[u.id] || ''}
                        onChange={(e) => setDaysInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                        style={{ width: '60px', padding: '6px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <button 
                        onClick={() => handleUpdateDays(u.id)}
                        disabled={loading === u.id || !daysInput[u.id]}
                        style={{ padding: '6px 10px', background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                      >
                        Apply
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <Link 
                      href={`/admin/users/${u.id}`}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Activity &rarr;
                    </Link>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: 'var(--text3)' }}>
                  No users found matching current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
