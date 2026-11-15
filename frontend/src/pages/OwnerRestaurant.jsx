import { useEffect, useMemo, useState } from 'react';
import { Pencil, Save, Store, RefreshCw, Plus, Power } from 'lucide-react';
import { createRestaurant, getMyRestaurants, updateRestaurant } from '../api/restaurants';

const emptyForm = { name: '', description: '', address: '', phone: '' };

function OwnerRestaurant({ onRestaurantsChanged }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const activeCount = useMemo(() => restaurants.filter(r => r.is_active).length, [restaurants]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const data = await getMyRestaurants();
      setRestaurants(data);
      onRestaurantsChanged?.(data);
    } catch (e) {
      setError(e.response?.data?.error?.message || e.response?.data?.detail || 'Unable to load restaurants.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const change = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const startEdit = (r) => {
    setEditingId(r.id); setShowCreate(false); setSuccess(''); setError('');
    setForm({ name: r.name || '', description: r.description || '', address: r.address || '', phone: r.phone || '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setError(''); setSuccess('');
      if (showCreate) {
        await createRestaurant(form);
        setSuccess('Restaurant created successfully.');
      } else {
        await updateRestaurant(editingId, form);
        setSuccess('Restaurant updated successfully.');
      }
      setForm(emptyForm); setEditingId(null); setShowCreate(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Unable to save restaurant.');
    } finally { setSaving(false); }
  };

  const toggle = async (r) => {
    try {
      setBusyId(r.id); setError(''); setSuccess('');
      await updateRestaurant(r.id, { is_active: !r.is_active });
      setSuccess(`${r.name} is now ${r.is_active ? 'inactive' : 'active'}.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'Unable to update restaurant status.');
    } finally { setBusyId(null); }
  };

  const cancelForm = () => { setForm(emptyForm); setEditingId(null); setShowCreate(false); setError(''); };

  if (loading) return <div className="owner-restaurant-message"><RefreshCw className="owner-loading-icon"/><p>Loading your restaurants...</p></div>;

  return (
    <div className="owner-workspace-section">
      <div className="owner-section-heading">
        <div><span className="owner-eyebrow">BUSINESS LOCATIONS</span><h2>My Restaurants</h2><p>Each restaurant has its own menu, orders and performance.</p></div>
        <button className="owner-primary-button" onClick={() => { setShowCreate(true); setEditingId(null); setForm(emptyForm); setError(''); }}><Plus size={17}/> Add Restaurant</button>
      </div>
      {error && <div className="owner-alert owner-alert-error">{error}</div>}
      {success && <div className="owner-alert owner-alert-success">{success}</div>}

      {(showCreate || editingId !== null) && (
        <form className="owner-form-card" onSubmit={submit}>
          <h3>{showCreate ? 'Add a New Restaurant' : 'Edit Restaurant'}</h3>
          <div className="owner-form-grid">
            <label className="owner-form-field">Restaurant name<input name="name" minLength="2" maxLength="150" required value={form.name} onChange={change}/></label>
            <label className="owner-form-field">Phone<input name="phone" maxLength="20" value={form.phone} onChange={change}/></label>
            <label className="owner-form-field owner-form-wide">Address<input name="address" required value={form.address} onChange={change}/></label>
            <label className="owner-form-field owner-form-wide">Description<textarea name="description" rows="3" value={form.description} onChange={change}/></label>
          </div>
          <div className="owner-form-actions"><button type="button" className="owner-secondary-button" onClick={cancelForm}>Cancel</button><button className="owner-primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save Restaurant'}</button></div>
        </form>
      )}

      <div className="owner-mini-summary">
        <div><strong>{restaurants.length}</strong><span>Total restaurants</span></div>
        <div><strong>{activeCount}</strong><span>Active</span></div>
        <div><strong>{restaurants.length - activeCount}</strong><span>Inactive</span></div>
      </div>

      {restaurants.length === 0 ? (
        <div className="owner-restaurant-message"><Store size={30}/><h3>No restaurants yet</h3><p>Add your first restaurant to start managing its menu and orders.</p><button className="owner-primary-button" onClick={() => setShowCreate(true)}><Plus size={16}/> Add Restaurant</button></div>
      ) : (
        <div className="owner-restaurant-grid">
          {restaurants.map(r => (
            <article className="owner-restaurant-card" key={r.id}>
              <div className="owner-restaurant-card-header"><div className="owner-restaurant-icon"><Store size={22}/></div><span className={r.is_active ? 'owner-status-active' : 'owner-status-inactive'}>{r.is_active ? 'Active' : 'Inactive'}</span></div>
              <h3>{r.name}</h3><p>{r.description || 'No description provided.'}</p>
              <div className="owner-restaurant-meta"><span>{r.address}</span>{r.phone && <span>{r.phone}</span>}</div>
              <div className="owner-card-actions">
                <button className="owner-secondary-button" onClick={() => startEdit(r)}><Pencil size={15}/> Edit</button>
                <button className="owner-secondary-button" disabled={busyId === r.id} onClick={() => toggle(r)}><Power size={15}/>{busyId === r.id ? 'Updating...' : r.is_active ? 'Deactivate' : 'Activate'}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
export default OwnerRestaurant;
