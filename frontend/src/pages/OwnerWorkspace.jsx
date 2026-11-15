import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Plus, Pencil, Power, ClipboardList, IndianRupee, Store, Bell, Truck, CheckCircle, XCircle } from 'lucide-react';
import { getMyRestaurants } from '../api/restaurants';
import {
  getOwnerMenuItems, createMenuItem, updateMenuItem, getOwnerOrders,
  updateOwnerOrderStatus, getDeliveryPartners, assignDeliveryPartner,
  getOwnerRefunds, reviewOwnerRefund, getOwnerStatistics, getOwnerReminders
} from '../api/owner';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const dateText = (v) => v ? new Date(v).toLocaleString() : '—';
const errorText = (e) => e.response?.data?.error?.message || e.response?.data?.detail || 'Something went wrong. Please try again.';

function Notice({ error, success }) {
  return <>{error && <div className="owner-alert owner-alert-error">{error}</div>}{success && <div className="owner-alert owner-alert-success">{success}</div>}</>;
}

function Overview({ restaurants, stats, orders, refunds, reminders, onNavigate }) {
  const active = restaurants.filter(r => r.is_active).length;
  const revenue = stats.reduce((n, s) => n + Number(s.total_revenue || 0), 0);
  const totalOrders = stats.reduce((n, s) => n + Number(s.total_orders || 0), 0);
  const pendingOrders = orders.filter(o => ['PLACED', 'ACCEPTED'].includes(o.status)).length;
  const pendingRefunds = refunds.filter(r => r.status === 'PENDING').length;
  const cards = [
    ['Total restaurants', restaurants.length, Store],
    ['Active restaurants', active, CheckCircle],
    ['Inactive restaurants', restaurants.length - active, XCircle],
    ['Total orders', totalOrders, ClipboardList],
    ['Pending orders', pendingOrders, Bell],
    ['Total revenue', money(revenue), IndianRupee],
    ['Pending refunds', pendingRefunds, RefreshCw],
    ['Reminders', reminders.filter(r => !r.is_read).length, Bell],
  ];
  return <div className="owner-workspace-section">
    <div className="owner-welcome-card"><span className="owner-eyebrow">BUSINESS OVERVIEW</span><h2>Welcome back!</h2><p>Here is a combined view of all restaurants owned by your account.</p></div>
    <div className="owner-kpi-grid">{cards.map(([label, value, Icon]) => <div className="owner-kpi-card" key={label}><span className="owner-kpi-icon"><Icon size={19}/></span><strong>{value}</strong><span>{label}</span></div>)}</div>
    <div className="owner-panel"><div className="owner-panel-heading"><div><h3>Restaurant performance</h3><p>Each restaurant is reported separately.</p></div><button className="owner-text-button" onClick={() => onNavigate('restaurant')}>Manage restaurants</button></div>
      {stats.length ? <div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Restaurant</th><th>Orders</th><th>Pending</th><th>Delivered</th><th>Cancelled</th><th>Revenue</th></tr></thead><tbody>{stats.map(s => <tr key={s.restaurant_id}><td><strong>{s.restaurant_name}</strong></td><td>{s.total_orders}</td><td>{s.pending_orders}</td><td>{s.completed_orders}</td><td>{s.cancelled_orders}</td><td>{money(s.total_revenue)}</td></tr>)}</tbody></table></div> : <p className="owner-muted">No restaurant statistics available yet.</p>}
    </div>
    <div className="owner-panel"><div className="owner-panel-heading"><div><h3>Needs your attention</h3><p>Orders and customer requests requiring action.</p></div></div>
      <div className="owner-attention-grid"><button onClick={() => onNavigate('orders')}><strong>{pendingOrders}</strong><span>Orders awaiting action</span></button><button onClick={() => onNavigate('refunds')}><strong>{pendingRefunds}</strong><span>Refund requests pending</span></button><button onClick={() => onNavigate('reminders')}><strong>{reminders.filter(r => !r.is_read).length}</strong><span>Unread reminders</span></button></div>
    </div>
  </div>;
}

const blankDish = { name: '', description: '', price: '', image_url: '', category: '' };
function MenuManagement({ restaurants }) {
  const [restaurantId, setRestaurantId] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankDish);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!restaurantId && restaurants.length) setRestaurantId(String(restaurants[0].id)); }, [restaurants, restaurantId]);
  const load = async () => { if (!restaurantId) return; try { setLoading(true); setError(''); setItems(await getOwnerMenuItems(restaurantId)); } catch(e) { setError(errorText(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [restaurantId]);
  const startEdit = item => { setEditing(item.id); setForm({ name:item.name, description:item.description || '', price:item.price, image_url:item.image_url || '', category:item.category || '' }); setShowForm(true); setError(''); };
  const submit = async e => { e.preventDefault(); try { setSaving(true); setError(''); setSuccess(''); const data = {...form, price:Number(form.price), image_url:form.image_url || null, category:form.category || null, description:form.description || null}; if(editing) await updateMenuItem(restaurantId, editing, data); else await createMenuItem(restaurantId, data); setShowForm(false); setEditing(null); setForm(blankDish); setSuccess(editing ? 'Dish updated.' : 'Dish added.'); await load(); } catch(e) { setError(errorText(e)); } finally { setSaving(false); } };
  const toggle = async item => { try { setError(''); await updateMenuItem(restaurantId, item.id, {is_available:!item.is_available}); setSuccess(`${item.name} availability updated.`); await load(); } catch(e) { setError(errorText(e)); } };
  if (!restaurants.length) return <Empty text="Add a restaurant before managing its menu."/>;
  return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">FOOD CATALOGUE</span><h2>Menu Management</h2><p>Add, edit and control dish availability for each restaurant.</p></div><button className="owner-primary-button" onClick={() => {setShowForm(true);setEditing(null);setForm(blankDish);}}><Plus size={16}/> Add Dish</button></div>
    <Notice error={error} success={success}/><div className="owner-toolbar"><label>Choose restaurant<select value={restaurantId} onChange={e=>setRestaurantId(e.target.value)}>{restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>
    {showForm && <form className="owner-form-card" onSubmit={submit}><h3>{editing ? 'Edit dish' : 'Add new dish'}</h3><div className="owner-form-grid">
      <label className="owner-form-field">Dish name<input required minLength="2" maxLength="150" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="owner-form-field">Price (₹)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
      <label className="owner-form-field">Category<input maxLength="100" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label>
      <label className="owner-form-field">Image URL<input maxLength="500" type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
      <label className="owner-form-field owner-form-wide">Description<textarea rows="2" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    </div><div className="owner-form-actions"><button type="button" className="owner-secondary-button" onClick={()=>setShowForm(false)}>Cancel</button><button className="owner-primary-button" disabled={saving}>{saving?'Saving...':'Save Dish'}</button></div></form>}
    {loading ? <Loading/> : items.length ? <div className="owner-data-grid">{items.map(item=><article className="owner-data-card" key={item.id}><div><span className={item.is_available?'owner-status-active':'owner-status-inactive'}>{item.is_available?'Available':'Unavailable'}</span><h3>{item.name}</h3><p>{item.description || item.category || 'No description'}</p><strong>{money(item.price)}</strong></div><div className="owner-card-actions"><button className="owner-secondary-button" onClick={()=>startEdit(item)}><Pencil size={14}/> Edit</button><button className="owner-secondary-button" onClick={()=>toggle(item)}><Power size={14}/>{item.is_available?'Mark unavailable':'Mark available'}</button></div></article>)}</div> : <Empty text="No dishes found for this restaurant yet."/>}
  </div>;
}

function Orders({ restaurants }) {
  const [orders,setOrders]=useState([]); const [status,setStatus]=useState(''); const [restaurantId,setRestaurantId]=useState(''); const [startDate,setStartDate]=useState(''); const [endDate,setEndDate]=useState(''); const [page,setPage]=useState(1); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [success,setSuccess]=useState('');
  const load=async()=>{try{setLoading(true);setError('');const data=await getOwnerOrders({page,limit:100,status:status||undefined,start_date:startDate||undefined,end_date:endDate||undefined});setOrders(data.filter(o=>!restaurantId||String(o.restaurant_id)===restaurantId));}catch(e){setError(errorText(e));}finally{setLoading(false);}};
  useEffect(()=>{load();},[page,status,startDate,endDate,restaurantId]);
  const nextStatus={PLACED:'ACCEPTED',ACCEPTED:'PREPARING',PREPARING:'READY'};
  const advance=async order=>{try{await updateOwnerOrderStatus(order.id,nextStatus[order.status]);setSuccess(`Order #${order.id} updated.`);await load();}catch(e){setError(errorText(e));}};
  return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">ORDER WORKFLOW</span><h2>Orders</h2><p>Review incoming orders and move them through preparation.</p></div><button className="owner-secondary-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div><Notice error={error} success={success}/>
    <div className="owner-filter-bar"><label>Restaurant<select value={restaurantId} onChange={e=>setRestaurantId(e.target.value)}><option value="">All restaurants</option>{restaurants.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label><label>Status<select value={status} onChange={e=>{setPage(1);setStatus(e.target.value);}}><option value="">All statuses</option>{['PLACED','ACCEPTED','PREPARING','READY','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s=><option key={s}>{s}</option>)}</select></label><label>From<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label>To<input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label></div>
    {loading?<Loading/>:orders.length?<div className="owner-order-list">{orders.map(o=><article className="owner-order-card" key={o.id}><div className="owner-order-heading"><div><strong>Order #{o.id}</strong><span>{restaurants.find(r=>r.id===o.restaurant_id)?.name || `Restaurant #${o.restaurant_id}`}</span></div><span className="owner-status-pill">{o.status}</span></div><p>{o.order_items?.map(i=>`${i.item_name} × ${i.quantity}`).join(', ')}</p><div className="owner-order-meta"><span>{dateText(o.created_at)}</span><strong>{money(o.total_amount)}</strong></div><p className="owner-order-address">{o.delivery_address}</p>{o.special_instructions&&<p>Note: {o.special_instructions}</p>}{nextStatus[o.status]&&<button className="owner-primary-button" onClick={()=>advance(o)}>Move to {nextStatus[o.status]}</button>}</article>)}</div>:<Empty text="No orders match these filters."/>}
    <div className="owner-pagination"><button className="owner-secondary-button" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous page</button><span>Page {page}</span><button className="owner-secondary-button" disabled={orders.length<100} onClick={()=>setPage(p=>p+1)}>Next page</button></div>
  </div>;
}

function Delivery({restaurants}) {
 const [orders,setOrders]=useState([]);const [partners,setPartners]=useState([]);const [restaurantId,setRestaurantId]=useState('');const [partnerByOrder,setPartnerByOrder]=useState({});const [error,setError]=useState('');const [success,setSuccess]=useState('');const [loading,setLoading]=useState(true);
 const load=async()=>{try{setLoading(true);const [o,p]=await Promise.all([getOwnerOrders({page:1,limit:100,status:'READY'}),getDeliveryPartners()]);setOrders(o.filter(x=>!restaurantId||String(x.restaurant_id)===restaurantId));setPartners(p);}catch(e){setError(errorText(e));}finally{setLoading(false);}};
 useEffect(()=>{load();},[restaurantId]);
 const assign=async id=>{try{await assignDeliveryPartner(id,partnerByOrder[id]);setSuccess(`Delivery partner assigned to order #${id}.`);await load();}catch(e){setError(errorText(e));}};
 return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">LAST-MILE OPERATIONS</span><h2>Delivery Assignment</h2><p>Assign an active delivery partner to READY orders.</p></div><button className="owner-secondary-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div><Notice error={error} success={success}/><div className="owner-toolbar"><label>Restaurant<select value={restaurantId} onChange={e=>setRestaurantId(e.target.value)}><option value="">All restaurants</option>{restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div>{loading?<Loading/>:orders.length?orders.map(o=><article className="owner-order-card" key={o.id}><div className="owner-order-heading"><strong>Order #{o.id}</strong><span className="owner-status-pill">READY</span></div><p>{o.order_items?.map(i=>`${i.item_name} × ${i.quantity}`).join(', ')}</p><div className="owner-assign-row"><select value={partnerByOrder[o.id]||''} onChange={e=>setPartnerByOrder({...partnerByOrder,[o.id]:e.target.value})}><option value="">Select delivery partner</option>{partners.map(p=><option value={p.id} key={p.id}>{p.full_name} (ID: {p.id})</option>)}</select><button className="owner-primary-button" disabled={!partnerByOrder[o.id]} onClick={()=>assign(o.id)}>Assign Partner</button></div></article>):<Empty text="There are no READY orders awaiting assignment."/>}</div>;
}

function Refunds() {
 const [rows,setRows]=useState([]);const [responses,setResponses]=useState({});const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [success,setSuccess]=useState('');
 const load=async()=>{try{setLoading(true);setRows(await getOwnerRefunds());}catch(e){setError(errorText(e));}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const decide=async(id,status)=>{try{setError('');await reviewOwnerRefund(id,status,responses[id]||null);setSuccess(`Request #${id} ${status.toLowerCase()}.`);await load();}catch(e){setError(errorText(e));}};
 return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">CUSTOMER SUPPORT</span><h2>Refund Requests</h2><p>Review customer requests for delivered orders.</p></div><button className="owner-secondary-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div><Notice error={error} success={success}/>{loading?<Loading/>:rows.length?rows.map(r=><article className="owner-order-card" key={r.id}><div className="owner-order-heading"><strong>Request #{r.id} · Order #{r.order_id}</strong><span className="owner-status-pill">{r.status}</span></div><p><strong>Reason:</strong> {r.reason}</p>{r.owner_response&&<p><strong>Owner response:</strong> {r.owner_response}</p>}{r.status==='PENDING'&&<><label className="owner-form-field">Response (optional)<textarea rows="2" value={responses[r.id]||''} onChange={e=>setResponses({...responses,[r.id]:e.target.value})}/></label><div className="owner-card-actions"><button className="owner-primary-button" onClick={()=>decide(r.id,'APPROVED')}>Approve refund</button><button className="owner-secondary-button" onClick={()=>decide(r.id,'REJECTED')}>Reject request</button></div></>}</article>):<Empty text="No refund requests found."/>}</div>;
}

function Statistics({stats}) {
 const revenue=stats.reduce((n,s)=>n+Number(s.total_revenue||0),0);
 return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">BUSINESS REPORTS</span><h2>Statistics</h2><p>Performance breakdown for every restaurant.</p></div></div><div className="owner-kpi-grid"><div className="owner-kpi-card"><strong>{stats.reduce((n,s)=>n+Number(s.total_orders||0),0)}</strong><span>Total orders</span></div><div className="owner-kpi-card"><strong>{money(revenue)}</strong><span>Delivered order revenue</span></div><div className="owner-kpi-card"><strong>{stats.reduce((n,s)=>n+Number(s.completed_orders||0),0)}</strong><span>Completed orders</span></div><div className="owner-kpi-card"><strong>{stats.reduce((n,s)=>n+Number(s.cancelled_orders||0),0)}</strong><span>Cancelled orders</span></div></div><div className="owner-panel"><div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Restaurant</th><th>Total orders</th><th>Pending</th><th>Completed</th><th>Cancelled</th><th>Revenue</th></tr></thead><tbody>{stats.map(s=><tr key={s.restaurant_id}><td>{s.restaurant_name}</td><td>{s.total_orders}</td><td>{s.pending_orders}</td><td>{s.completed_orders}</td><td>{s.cancelled_orders}</td><td>{money(s.total_revenue)}</td></tr>)}</tbody></table></div></div></div>;
}

function Reminders() {
 const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{getOwnerReminders().then(setRows).catch(e=>setError(errorText(e))).finally(()=>setLoading(false));},[]);
 return <div className="owner-workspace-section"><div className="owner-section-heading"><div><span className="owner-eyebrow">FOLLOW-UP QUEUE</span><h2>Reminders</h2><p>Orders flagged by the backend reminder scheduler.</p></div><button className="owner-secondary-button" onClick={()=>{setLoading(true);getOwnerReminders().then(setRows).catch(e=>setError(errorText(e))).finally(()=>setLoading(false));}}><RefreshCw size={15}/> Refresh</button></div>{error&&<Notice error={error}/ >}{loading?<Loading/>:rows.length?rows.map(r=><article className="owner-order-card" key={r.id}><div className="owner-order-heading"><strong>Order #{r.order_id}</strong><span className={r.is_read?'owner-status-inactive':'owner-status-active'}>{r.is_read?'Read':'Unread'}</span></div><p>{r.message}</p><small>{dateText(r.created_at)} · Restaurant #{r.restaurant_id}</small></article>):<Empty text="No reminders at the moment."/>}</div>;
}

function Loading(){return <div className="owner-restaurant-message"><RefreshCw className="owner-loading-icon"/><p>Loading data...</p></div>;}
function Empty({text}){return <div className="owner-restaurant-message"><Store size={25}/><p>{text}</p></div>;}

export default function OwnerWorkspace({section, restaurants, onNavigate}) {
 const [stats,setStats]=useState([]);const [orders,setOrders]=useState([]);const [refunds,setRefunds]=useState([]);const [reminders,setReminders]=useState([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  Promise.allSettled([getOwnerStatistics(),getOwnerOrders({page:1,limit:100}),getOwnerRefunds(),getOwnerReminders()]).then(results=>{
   if(!alive)return;
   const [s,o,r,m]=results;
   if(s.status==='fulfilled')setStats(s.value);else setError(errorText(s.reason));
   if(o.status==='fulfilled')setOrders(o.value);
   if(r.status==='fulfilled')setRefunds(r.value);
   if(m.status==='fulfilled')setReminders(m.value);
  }).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[]);
 if(loading && section==='overview') return <Loading/>;
 if(section==='overview') return <>{error&&<Notice error={error}/>}<Overview restaurants={restaurants} stats={stats} orders={orders} refunds={refunds} reminders={reminders} onNavigate={onNavigate}/></>;
 if(section==='menu') return <MenuManagement restaurants={restaurants}/>;
 if(section==='orders') return <Orders restaurants={restaurants}/>;
 if(section==='delivery') return <Delivery restaurants={restaurants}/>;
 if(section==='refunds') return <Refunds/>;
 if(section==='statistics') return <Statistics stats={stats}/>;
 if(section==='reminders') return <Reminders/>;
 return null;
}
