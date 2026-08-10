'use client';

import { useState } from 'react';
import { addPlan, editPlan, togglePlan, deletePlan } from './actions';

export default function PlansClient({ initialPlans }) {
  const [plans, setPlans] = useState(initialPlans);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async (plan) => {
    const updated = !plan.is_active;
    setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: updated } : p));
    await togglePlan(plan.id, updated);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      setPlans(plans.filter(p => p.id !== id));
      await deletePlan(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.target);
    const res = await addPlan(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setIsAdding(false);
      window.location.reload(); // Quick refresh to get new plans
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.target);
    const res = await editPlan(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setEditingId(null);
      window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#fff' }}>Active Plans</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="gms-btn gms-btn--primary">
          {isAdding ? 'Cancel' : '+ Add New Plan'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '30px', border: '1px solid var(--acc)' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--acc)' }}>Create New Plan</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Plan Name</label>
              <input name="name" required placeholder="e.g. Weekend Pass" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Price (UGX)</label>
              <input type="number" name="price" required placeholder="e.g. 5000" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Duration (Days)</label>
              <input type="number" name="duration_days" required placeholder="e.g. 7" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Features (Comma separated)</label>
            <input name="features" required placeholder="e.g. 7 days access, HD Streaming, Downloadable" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" defaultChecked />
              Set Active Immediately
            </label>
          </div>

          {error && <div style={{ color: '#e50914', marginBottom: '15px' }}>{error}</div>}

          <button type="submit" disabled={loading} className="gms-btn gms-btn--primary" style={{ padding: '12px 24px' }}>
            {loading ? 'Saving...' : 'Save Plan'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {plans.map(plan => {
          
          if (editingId === plan.id) {
            return (
              <form key={plan.id} onSubmit={handleEditSubmit} style={{ 
                background: 'var(--bg2)', 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid var(--acc)'
              }}>
                <input type="hidden" name="id" value={plan.id} />
                <h3 style={{ margin: '0 0 15px', color: 'var(--acc)', fontSize: '18px' }}>Edit {plan.name}</h3>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Name</label>
                  <input name="name" defaultValue={plan.name} required style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Price (UGX)</label>
                    <input type="number" name="price" defaultValue={plan.price} required style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Days</label>
                    <input type="number" name="duration_days" defaultValue={plan.duration_days} required style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Features</label>
                  <input name="features" defaultValue={plan.features} required style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
                </div>

                {error && <div style={{ color: '#e50914', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="gms-btn gms-btn--primary" style={{ flex: 1, padding: '8px' }}>
                    {loading ? '...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="gms-btn" style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--text2)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div key={plan.id} style={{ 
              background: 'var(--bg2)', 
              padding: '24px', 
              borderRadius: '12px', 
              border: `1px solid ${plan.is_active ? 'rgba(255,255,255,0.1)' : 'rgba(229, 9, 20, 0.3)'}`,
              opacity: plan.is_active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{plan.name}</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => setEditingId(plan.id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' }}>
                    Edit
                  </button>
                  <button onClick={() => handleToggle(plan)} style={{ background: 'transparent', border: 'none', color: plan.is_active ? 'var(--text2)' : '#46b450', cursor: 'pointer', padding: '5px' }}>
                    {plan.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(plan.id)} style={{ background: 'transparent', border: 'none', color: '#e50914', cursor: 'pointer', padding: '5px' }}>
                    Delete
                  </button>
                </div>
              </div>
              
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--acc)', marginBottom: '5px' }}>
                {Number(plan.price).toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text2)' }}>UGX</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '15px' }}>Duration: {plan.duration_days} days</div>
              
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: 'var(--text2)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.features.split(',').map((f, i) => (
                  <li key={i}>✅ {f.trim()}</li>
                ))}
              </ul>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div style={{ color: 'var(--text2)', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
            No plans created yet.
          </div>
        )}
      </div>
    </div>
  );
}
