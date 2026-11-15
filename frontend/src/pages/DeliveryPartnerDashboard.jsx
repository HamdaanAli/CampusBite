import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bike, Package, MapPin, Clock, CheckCircle2, RefreshCw,
  LogOut, Menu, X, AlertCircle, Truck, History, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyDeliveries, updateDeliveryStatus } from '../api/deliveryPartner';
import '../styles/DeliveryPartnerDashboard.css';

const FILTERS = [
  { value: 'ALL', label: 'All deliveries' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
];

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    : '—';
};

function DeliveryPartnerDashboard() {
  const { user, logout } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadDeliveries = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const data = await getMyDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error?.message ||
        'Unable to load your deliveries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const counts = useMemo(() => ({
    total: deliveries.length,
    assigned: deliveries.filter((item) => item.status === 'ASSIGNED').length,
    onTheWay: deliveries.filter((item) => item.status === 'OUT_FOR_DELIVERY').length,
    delivered: deliveries.filter((item) => item.status === 'DELIVERED').length,
  }), [deliveries]);

  const visibleDeliveries = useMemo(() => (
    filter === 'ALL' ? deliveries : deliveries.filter((item) => item.status === filter)
  ), [deliveries, filter]);

  const handleStatusUpdate = async (order) => {
    const nextStatus = order.status === 'ASSIGNED' ? 'OUT_FOR_DELIVERY' : 'DELIVERED';
    setUpdatingId(order.id);
    setError('');
    setSuccess('');
    try {
      const updated = await updateDeliveryStatus(order.id, nextStatus);
      setDeliveries((current) => current.map((item) => item.id === order.id ? updated : item));
      setSuccess(`Order #${order.id} updated to ${nextStatus.replaceAll('_', ' ')}.`);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error?.message ||
        'Unable to update this delivery. Please refresh and try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dp-dashboard">
      <header className="dp-mobile-header">
        <button className="dp-icon-button" onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu">{mobileMenuOpen ? <X /> : <Menu />}</button>
        <strong>CampusBite <span>Delivery</span></strong>
      </header>

      <aside className={`dp-sidebar ${mobileMenuOpen ? 'dp-sidebar-open' : ''}`}>
        <div className="dp-brand"><span><Bike size={23} /></span>
          <div>Campus<span>Bite</span><small>DELIVERY PARTNER</small></div>
        </div>
        <div className="dp-profile">
          <div className="dp-avatar">{user?.full_name?.charAt(0)?.toUpperCase() || 'D'}</div>
          <div><strong>{user?.full_name || 'Delivery Partner'}</strong><small>Delivery Partner</small></div>
        </div>
        <div className="dp-side-label">WORKSPACE</div>
        <div className="dp-side-current"><LayoutDashboard size={18} /> My Deliveries</div>
        <button className="dp-logout" onClick={logout}><LogOut size={18} /> Sign Out</button>
      </aside>
      {mobileMenuOpen && <button className="dp-overlay" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />}

      <main className="dp-main">
        <header className="dp-topbar">
          <div><span className="dp-eyebrow">DELIVERY PARTNER PORTAL</span><h1>My Deliveries</h1>
            <p>Manage your assigned orders and update delivery progress.</p></div>
          <button className="dp-refresh" onClick={() => loadDeliveries(false)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'dp-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </header>

        <section className="dp-content">
          {error && <div className="dp-alert dp-error"><AlertCircle size={18} />{error}</div>}
          {success && <div className="dp-alert dp-success"><CheckCircle2 size={18} />{success}</div>}

          <div className="dp-stat-grid">
            <article><span>Total assigned to me</span><strong>{counts.total}</strong><Package /></article>
            <article><span>Waiting to start</span><strong>{counts.assigned}</strong><Clock /></article>
            <article><span>Out for delivery</span><strong>{counts.onTheWay}</strong><Truck /></article>
            <article><span>Delivered</span><strong>{counts.delivered}</strong><CheckCircle2 /></article>
          </div>

          <div className="dp-list-heading">
            <div><h2>Delivery Tasks</h2><p>Only orders assigned to your account are shown.</p></div>
            <div className="dp-filters">
              {FILTERS.map((item) => <button key={item.value}
                className={filter === item.value ? 'dp-filter-active' : ''}
                onClick={() => setFilter(item.value)}>{item.label}</button>)}
            </div>
          </div>

          {loading ? <div className="dp-state"><RefreshCw className="dp-spin" />Loading your deliveries...</div>
            : visibleDeliveries.length === 0 ? (
              <div className="dp-state dp-empty"><Bike size={35} /><h3>No deliveries found</h3>
                <p>{filter === 'ALL' ? 'You do not have any assigned deliveries yet.' : `There are no ${filter.toLowerCase().replaceAll('_', ' ')} deliveries.`}</p>
              </div>
            ) : (
              <div className="dp-order-list">
                {visibleDeliveries.map((order) => (
                  <article className="dp-order-card" key={order.id}>
                    <div className="dp-order-head">
                      <div><span className="dp-order-number">ORDER #{order.id}</span>
                        <small>Placed {formatDate(order.created_at)}</small></div>
                      <span className={`dp-status dp-status-${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span>
                    </div>
                    <div className="dp-order-info">
                      <div><MapPin size={17} /><section><small>DELIVERY ADDRESS</small><p>{order.delivery_address || 'Address not provided'}</p></section></div>
                      <div><Package size={17} /><section><small>ORDER ITEMS</small>
                        <p>{order.order_items?.length ? order.order_items.map((item) =>
                          `${item.item_name} × ${item.quantity}`).join(', ') : 'Order item details unavailable'}</p></section></div>
                      <div><strong className="dp-total">{money(order.total_amount)}</strong><small>ORDER TOTAL</small></div>
                    </div>
                    {order.special_instructions && <div className="dp-instructions"><strong>Customer instructions:</strong> {order.special_instructions}</div>}
                    <div className="dp-order-footer">
                      <span>Payment: {order.payment_status || '—'}</span>
                      {order.status === 'ASSIGNED' && <button disabled={updatingId === order.id}
                        onClick={() => handleStatusUpdate(order)}><Truck size={16} />
                        {updatingId === order.id ? 'Updating...' : 'Start delivery'}</button>}
                      {order.status === 'OUT_FOR_DELIVERY' && <button disabled={updatingId === order.id}
                        onClick={() => handleStatusUpdate(order)}><CheckCircle2 size={16} />
                        {updatingId === order.id ? 'Updating...' : 'Mark as delivered'}</button>}
                      {order.status === 'DELIVERED' && <span className="dp-delivered-label"><CheckCircle2 size={16} /> Completed</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default DeliveryPartnerDashboard;