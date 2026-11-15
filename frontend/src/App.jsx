import { useEffect, useState } from 'react';
import {
  Utensils,
  Search,
  ShoppingBag,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Bike,
  Flame,
  Leaf,
  Coffee,
  Pizza,
  Menu,
  X,
  Heart,
  ChevronDown,
} from 'lucide-react';

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider, useCart } from './context/CartContext';
import { getRestaurants } from './api/customerCatalog';
import RestaurantMenu from './pages/RestaurantMenu';
import CartCheckout from './pages/CartCheckout';
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';

// ==================== HOMEPAGE CATEGORY DATA ====================
const categories = [
  { name: 'All', icon: Utensils },
  { name: 'Pizza', icon: Pizza },
  { name: 'Burgers', icon: Flame },
  { name: 'Healthy', icon: Leaf },
  { name: 'Coffee', icon: Coffee },
];

// Restaurant cards now use live backend data. Images are presentation fallbacks only.
const restaurantImages = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&auto=format&fit=crop&q=85',
];

// ==================== HOMEPAGE COMPONENT ====================
function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState('');

  // Get the logged-in user, cart count and navigation helpers.
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { itemCount } = useCart();

  // Load active restaurants from the backend instead of demo data.
  useEffect(() => {
    let active = true;
    getRestaurants()
      .then((data) => { if (active) setRestaurants(Array.isArray(data) ? data : []); })
      .catch((error) => {
        if (active) setRestaurantsError(error.response?.data?.detail || 'Unable to load restaurants. Please try again.');
      })
      .finally(() => { if (active) setRestaurantsLoading(false); });
    return () => { active = false; };
  }, []);

  // Match category labels against the restaurant name and description because
  // the current RestaurantResponse schema does not expose a cuisine field.
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const searchable = `${restaurant.name} ${restaurant.description || ''}`.toLowerCase();
    const matchesCategory = activeCategory === 'All' ||
      searchable.includes(activeCategory.toLowerCase());
    const matchesSearch = searchable.includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Display a temporary notification message.
  const showMessage = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="app">
      {/* ==================== NAVIGATION ==================== */}
      <header className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon">
            <Utensils size={23} strokeWidth={2.5} />
          </span>
          <span>
            Campus<span className="brand-highlight">Bite</span>
            <small>GOOD FOOD. GOOD MOOD.</small>
          </span>
        </a>

        <nav className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
          <a href="#restaurants" onClick={() => setMobileMenuOpen(false)}>Restaurants</a>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)}>Categories</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        </nav>

        <div className="nav-actions">
          <button
            className="location-button"
            onClick={() => showMessage('Location selection will be available soon.')}
          >
            <MapPin size={17} />
            <span>Campus</span>
            <ChevronDown size={14} />
          </button>

          <button
            className="cart-button"
            onClick={() => navigate('/cart')}
            aria-label="Shopping cart"
          >
            <ShoppingBag size={19} />
            <span>Cart</span>
            <span className="cart-count">{itemCount}</span>
          </button>

          {/* ==================== AUTHENTICATED USER NAVIGATION ==================== */}
          {user ? (
            <>
              {/* Navigate the logged-in user to their role-specific dashboard. */}
              <Link
                to={
                  user.role === 'CUSTOMER'
                    ? '/customer'
                    : user.role === 'RESTAURANT_OWNER'
                      ? '/owner'
                      : '/delivery'
                }
                className="signin-button"
              >
                My Dashboard
              </Link>

              {/* Sign out the currently logged-in user. */}
              <button
                className="signin-button"
                onClick={logout}
              >
                Sign out
              </button>
            </>
          ) : (
            /* Show Sign in when nobody is logged in. */
            <Link to="/login" className="signin-button">
              Sign in
            </Link>
          )}

          {/* Mobile navigation menu button. */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <main>
        {/* ==================== HERO SECTION ==================== */}
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              YOUR CAMPUS, YOUR CRAVINGS
            </div>

            <h1>
              Good food.
              <br />
              <span>Great days.</span>
              <br />
              Delivered.
            </h1>

            <p className="hero-description">
              Your favourite campus food, just a few clicks away.
              Discover amazing restaurants and get your cravings
              delivered right to you.
            </p>

            <div className="hero-buttons">
              <a href="#restaurants" className="primary-button">
                Explore restaurants
                <ArrowRight size={18} />
              </a>
              <div className="delivery-note">
                <Bike size={20} />
                <span>Quick campus delivery</span>
              </div>
            </div>

            <div className="hero-stats">
              <div>
                <strong>50+</strong>
                <span>Food choices</span>
              </div>
              <div className="stat-divider" />
              <div>
                <strong>30 min</strong>
                <span>Average delivery</span>
              </div>
              <div className="stat-divider" />
              <div>
                <strong>4.8/5</strong>
                <span>Happy foodies</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1100&auto=format&fit=crop&q=90"
                alt="Delicious meal served on a table"
              />

              <div className="floating-card delivery-card">
                <span className="floating-icon">
                  <Bike size={21} />
                </span>
                <span>
                  <strong>Fast delivery</strong>
                  <small>Fresh at your doorstep</small>
                </span>
              </div>

              <div className="floating-card rating-card">
                <Star size={19} fill="#F6A623" color="#F6A623" />
                <span>
                  <strong>4.8 / 5</strong>
                  <small>Loved by students</small>
                </span>
              </div>
            </div>
            <div className="hero-decoration" />
          </div>
        </section>

        {/* ==================== CATEGORIES SECTION ==================== */}
        <section className="categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT ARE YOU CRAVING?</span>
              <h2>Explore by category</h2>
            </div>
            <span className="section-note">Something delicious for everyone.</span>
          </div>

          <div className="category-list">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.name}
                  className={`category-item ${
                    activeCategory === category.name ? 'category-active' : ''
                  }`}
                  onClick={() => {
                    setActiveCategory(category.name);
                    document.getElementById('restaurants')?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                >
                  <span className="category-icon">
                    <Icon size={23} />
                  </span>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================== RESTAURANTS SECTION ==================== */}
        <section className="restaurants-section" id="restaurants">
          <div className="section-heading restaurant-heading">
            <div>
              <span className="eyebrow">HANDPICKED FOR YOU</span>
              <h2>Popular near you <span>✦</span></h2>
              <p>Discover the spots everyone's talking about.</p>
            </div>
            <a href="#restaurants" className="view-all-link">
              Explore all <ArrowUpRight size={18} />
            </a>
          </div>

          {/* Restaurant search input. */}
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Display filtered restaurant cards. */}
          <div className="restaurant-grid">
            {restaurantsLoading ? (
              <div className="empty-search"><Clock size={30}/><h3>Loading restaurants...</h3></div>
            ) : restaurantsError ? (
              <div className="empty-search"><h3>{restaurantsError}</h3><button onClick={() => window.location.reload()}>Retry</button></div>
            ) : filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((restaurant, index) => (
                <article
                  className="restaurant-card customer-restaurant-clickable"
                  key={restaurant.id}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/restaurant/${restaurant.id}`); }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="restaurant-image">
                    <img src={restaurantImages[index % restaurantImages.length]} alt={restaurant.name} />
                    <span className="offer-tag">AVAILABLE</span>
                    <button
                      className="favorite-button"
                      onClick={(event) => { event.stopPropagation(); showMessage(`${restaurant.name} saved to favourites!`); }}
                      aria-label={`Save ${restaurant.name}`}
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                  <div className="restaurant-info">
                    <div className="restaurant-title-row"><h3>{restaurant.name}</h3></div>
                    <p>{restaurant.description || 'Explore freshly prepared dishes.'}</p>
                    <div className="restaurant-meta">
                      <span><MapPin size={14}/> {restaurant.address}</span>
                      <span>View menu →</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-search">
                <Search size={32} />
                <h3>No restaurants found</h3>
                <p>Try another search or select a different category.</p>
                <button onClick={() => { setSearch(''); setActiveCategory('All'); }}>Clear filters</button>
              </div>
            )}
          </div>
        </section>

        {/* ==================== PROMOTIONAL SECTION ==================== */}
        <section className="promo-section" id="about">
          <div className="promo-icon"><Flame size={30} /></div>
          <div>
            <span>THE CAMPUS FOOD EXPERIENCE</span>
            <h2>Your cravings deserve better.</h2>
            <p>Great food, easy ordering and more time for what matters.</p>
          </div>
          <a href="#restaurants" className="promo-button">
            Find your food <ArrowRight size={18} />
          </a>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="footer">
        <a href="#home" className="brand footer-brand">
          <span className="brand-icon">
            <Utensils size={21} />
          </span>
          <span>
            Campus<span className="brand-highlight">Bite</span>
            <small>GOOD FOOD. GOOD MOOD.</small>
          </span>
        </a>
        <p>Made for campus foodies. © 2026 CampusBite.</p>
        <a href="#home">Back to top ↑</a>
      </footer>

      {/* Temporary notification message. */}
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}

// ==================== APPLICATION ROUTES ====================
function AppRoutes() {
  const { user, loading } = useAuth();

  // Wait until the authentication session has been checked.
  if (loading) {
    return <div className="auth-page">Loading CampusBite...</div>;
  }

  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      <Route path="/" element={<Home />} />
      <Route path="/restaurant/:restaurantId" element={<RestaurantMenu />} />
      <Route path="/cart" element={<CartCheckout />} />

      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />

      {/* ==================== CUSTOMER PROTECTED ROUTES ==================== */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route
          path="/customer"
          element={<CustomerDashboard />}
        />
      </Route>

      {/* ==================== RESTAURANT OWNER PROTECTED ROUTES ==================== */}
      <Route element={<ProtectedRoute allowedRoles={['RESTAURANT_OWNER']} />}>
        <Route
          path="/owner"
          element={<OwnerDashboard />}
        />
      </Route>

      {/* ==================== DELIVERY PARTNER PROTECTED ROUTES ==================== */}
      <Route element={<ProtectedRoute allowedRoles={['DELIVERY_PARTNER']} />}>
        <Route
          path="/delivery"
          element={<DeliveryPartnerDashboard />}
        />
      </Route>

      {/* ==================== UNKNOWN ROUTES ==================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ==================== MAIN APP COMPONENT ====================
function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
