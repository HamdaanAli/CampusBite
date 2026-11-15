
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Utensils,
  ClipboardList,
  Truck,
  RefreshCcw,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import '../styles/OwnerDashboard.css';
import OwnerRestaurant from './OwnerRestaurant';
import OwnerWorkspace from './OwnerWorkspace';
import { getMyRestaurants } from '../api/restaurants';

// ==================== OWNER DASHBOARD NAVIGATION ====================
const navigationItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'restaurant', label: 'My Restaurant', icon: Store },
  { id: 'menu', label: 'Menu Management', icon: Utensils },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'delivery', label: 'Delivery Assignment', icon: Truck },
  { id: 'refunds', label: 'Refund Requests', icon: RefreshCcw },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

// ==================== OWNER DASHBOARD COMPONENT ====================
function OwnerDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    getMyRestaurants().then(setRestaurants).catch((error) => {
      console.error('Unable to load owner restaurants:', error);
    });
  }, []);

  const { user, logout } = useAuth();

  // Find the selected section's title.
  const activeItem = navigationItems.find(
    (item) => item.id === activeSection
  );

  // ==================== DASHBOARD CONTENT ====================
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OwnerWorkspace section="overview" restaurants={restaurants} onNavigate={setActiveSection} />;

      case 'restaurant':
        return <OwnerRestaurant onRestaurantsChanged={setRestaurants} />;

      case 'menu':
      case 'orders':
      case 'delivery':
      case 'refunds':
      case 'statistics':
      case 'reminders':
        return <OwnerWorkspace section={activeSection} restaurants={restaurants} onNavigate={setActiveSection} />;

      default:
        return null;
    }
  };

  return (
    <div className="owner-dashboard">

      {/* ==================== MOBILE HEADER ==================== */}
      <header className="owner-mobile-header">
        <button
          className="owner-mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle dashboard menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <span>CampusBite <strong>Owner</strong></span>
      </header>

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`owner-sidebar ${mobileMenuOpen ? 'owner-sidebar-open' : ''}`}>
        <div className="owner-brand">
          <span className="owner-brand-icon">
            <Utensils size={23} />
          </span>

          <span>
            Campus<strong>Bite</strong>
            <small>OWNER PORTAL</small>
          </span>
        </div>

        <div className="owner-profile">
          <div className="owner-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'O'}
          </div>

          <div className="owner-profile-details">
            <strong>{user?.full_name || 'Restaurant Owner'}</strong>
            <span>Restaurant Owner</span>
          </div>
        </div>

        <span className="owner-menu-heading">WORKSPACE</span>

        <nav className="owner-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`owner-nav-item ${
                  activeSection === item.id ? 'owner-nav-active' : ''
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ==================== SIDEBAR LOGOUT ==================== */}
        <button className="owner-logout-button" onClick={logout}>
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* ==================== MAIN DASHBOARD AREA ==================== */}
      <main className="owner-main">

        <header className="owner-topbar">
          <div>
            <span className="owner-topbar-label">OWNER WORKSPACE</span>
            <h1>{activeItem?.label || 'Dashboard'}</h1>
          </div>

          <div className="owner-topbar-user">
            <span>{user?.full_name || 'Owner'}</span>
            <div className="owner-avatar owner-avatar-small">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'O'}
            </div>
          </div>
        </header>

        <section className="owner-content">
          {renderContent()}
        </section>

      </main>

      {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
      {mobileMenuOpen && (
        <button
          className="owner-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close dashboard menu"
        />
      )}
    </div>
  );
}

export default OwnerDashboard;