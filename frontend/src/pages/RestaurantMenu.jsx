import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Minus, LoaderCircle, Utensils } from 'lucide-react';
import { getRestaurantMenu, getRestaurants } from '../api/customerCatalog';
import { useCart } from '../context/CartContext';
import '../styles/CustomerOrdering.css';

function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { cart, itemCount, addItem } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [restaurants, items] = await Promise.all([
          getRestaurants(), getRestaurantMenu(restaurantId),
        ]);
        if (!active) return;
        const selected = restaurants.find((item) => item.id === Number(restaurantId));
        if (!selected) {
          setError('This restaurant is unavailable or could not be found.');
        } else {
          setRestaurant(selected);
          setMenu(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.detail || 'Unable to load this restaurant menu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [restaurantId]);

  const handleAdd = (item) => {
    const switching = cart.restaurant && cart.restaurant.id !== Number(restaurantId) && cart.items.length;
    if (switching && !window.confirm('Your cart contains items from another restaurant. Clear it and add this item?')) return;
    addItem(restaurant, item);
    setNotice(`${item.name} added to your cart.`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  if (loading) return <div className="ordering-page ordering-state"><LoaderCircle className="ordering-spin"/>Loading restaurant menu...</div>;

  return (
    <div className="ordering-page">
      <header className="ordering-topbar">
        <Link to="/" className="ordering-back"><ArrowLeft size={18}/> Back to restaurants</Link>
        <button className="ordering-cart-link" onClick={() => navigate('/cart')}><ShoppingBag size={18}/> Cart ({itemCount})</button>
      </header>
      {error ? <div className="ordering-alert ordering-error">{error}</div> : <>
        <section className="ordering-restaurant-hero">
          <span className="ordering-eyebrow">CAMPUSBITE RESTAURANT</span>
          <h1>{restaurant?.name}</h1>
          <p>{restaurant?.description || 'Freshly prepared food, made for your cravings.'}</p>
          <small>{restaurant?.address}</small>
        </section>
        {notice && <div className="ordering-alert ordering-success">{notice}</div>}
        <section className="ordering-menu-section">
          <div className="ordering-section-title"><div><span className="ordering-eyebrow">MADE FRESH FOR YOU</span><h2>Explore the menu</h2></div><span>{menu.length} dishes</span></div>
          {menu.length === 0 ? <div className="ordering-empty"><Utensils size={32}/><h3>Menu coming soon</h3><p>This restaurant has no available dishes right now.</p></div> :
            <div className="ordering-menu-grid">
              {menu.map((item) => (
                <article className="ordering-menu-card" key={item.id}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} onError={(e) => { e.currentTarget.style.display = 'none'; }}/> :
                    <div className="ordering-menu-placeholder"><Utensils size={32}/></div>}
                  <div className="ordering-menu-details">
                    <span className="ordering-category">{item.category || 'Freshly prepared'}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description || 'Prepared fresh when you order.'}</p>
                    <div className="ordering-menu-bottom"><strong>₹{Number(item.price).toFixed(2)}</strong><button onClick={() => handleAdd(item)}><Plus size={16}/> Add</button></div>
                  </div>
                </article>
              ))}
            </div>}
        </section>
        {itemCount > 0 && <button className="ordering-floating-cart" onClick={() => navigate('/cart')}><ShoppingBag size={18}/> View cart · {itemCount} items · ₹{cart.items.reduce((s,i)=>s+i.price*i.quantity,0).toFixed(2)}</button>}
      </>}
    </div>
  );
}
export default RestaurantMenu;
