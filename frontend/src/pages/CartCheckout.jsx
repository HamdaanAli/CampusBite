import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { placeRestaurantOrder } from '../api/customerCatalog';
import '../styles/CustomerOrdering.css';

function CartCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, itemCount, total, changeQuantity, removeItem, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cart.restaurant || !cart.items.length) {
      setError('Your cart is empty. Please add dishes before checkout.');
      return;
    }
    if (address.trim().length < 5) {
      setError('Please enter a delivery address of at least 5 characters.');
      return;
    }
    if (user?.role !== 'CUSTOMER') {
      setError('Please sign in with a customer account to place an order.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const order = await placeRestaurantOrder(cart.restaurant.id, {
        delivery_address: address.trim(),
        special_instructions: instructions.trim() || null,
        items: cart.items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      navigate('/customer', {
        replace: true,
        state: { orderPlaced: true, orderId: order.id },
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not place your order. Please check availability and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.items.length) return (
    <div className="ordering-page">
      <header className="ordering-topbar"><Link to="/" className="ordering-back"><ArrowLeft size={18}/> Continue browsing</Link></header>
      <div className="ordering-empty ordering-empty-cart"><ShoppingBag size={42}/><h2>Your cart is empty</h2><p>Explore restaurants and add your favourite dishes.</p><Link className="ordering-primary-link" to="/">Browse restaurants</Link></div>
    </div>
  );

  return (
    <div className="ordering-page">
      <header className="ordering-topbar"><Link to={`/restaurant/${cart.restaurant.id}`} className="ordering-back"><ArrowLeft size={18}/> Back to menu</Link><span className="ordering-secure-label">Dummy payment · No real charge</span></header>
      <main className="ordering-checkout-layout">
        <section className="ordering-cart-panel">
          <span className="ordering-eyebrow">YOUR SELECTION</span><h1>Your cart</h1><p className="ordering-muted">{cart.restaurant.name} · {itemCount} items</p>
          {cart.items.map((item) => (
            <article className="ordering-cart-item" key={item.id}>
              <div className="ordering-cart-item-info"><strong>{item.name}</strong><span>₹{item.price.toFixed(2)} each</span></div>
              <div className="ordering-quantity">
                <button aria-label={`Decrease ${item.name}`} onClick={() => changeQuantity(item.id,item.quantity-1)}><Minus size={14}/></button><strong>{item.quantity}</strong><button aria-label={`Increase ${item.name}`} onClick={() => changeQuantity(item.id,item.quantity+1)}><Plus size={14}/></button>
                <button className="ordering-remove" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={16}/></button>
              </div>
              <strong className="ordering-line-total">₹{(item.price*item.quantity).toFixed(2)}</strong>
            </article>
          ))}
          <div className="ordering-total-row"><span>Subtotal</span><strong>₹{total.toFixed(2)}</strong></div>
          <div className="ordering-total-row"><span>Delivery fee</span><strong>₹0.00</strong></div>
          <div className="ordering-grand-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>
        </section>
        <form className="ordering-checkout-panel" onSubmit={submitOrder}>
          <span className="ordering-eyebrow">FINAL STEP</span><h2>Delivery details</h2>
          {error && <div className="ordering-alert ordering-error">{error}</div>}
          {!user && <div className="ordering-alert ordering-error">Please <Link to="/login">sign in</Link> as a customer before placing your order.</div>}
          {user && user.role !== 'CUSTOMER' && <div className="ordering-alert ordering-error">Only customer accounts can place orders.</div>}
          <label><span><MapPin size={16}/> Delivery address</span><textarea value={address} onChange={(e)=>setAddress(e.target.value)} minLength={5} required placeholder="Enter your complete delivery address" rows={4}/></label>
          <label><span>Special instructions (optional)</span><textarea value={instructions} onChange={(e)=>setInstructions(e.target.value)} placeholder="Landmark, gate number or delivery notes" rows={3}/></label>
          <div className="ordering-payment-note"><CheckCircle2 size={18}/><div><strong>Dummy payment</strong><p>No real payment gateway is used. Your order will be recorded as mock_paid after successful placement.</p></div></div>
          <button className="ordering-place-order" type="submit" disabled={submitting || user?.role !== 'CUSTOMER'}>{submitting ? 'Placing order...' : `Place order · ₹${total.toFixed(2)}`}</button>
        </form>
      </main>
    </div>
  );
}
export default CartCheckout;
