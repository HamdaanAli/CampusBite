
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Star,
  Sparkles,
  UserRound,
  Utensils,
  LogOut,
  Menu,
  X,
  Ban,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/CustomerDashboard.css';

import { getMyOrders, cancelMyOrder } from '../api/orders';
import {
  getMyReturnRequests,
  createReturnRequest,
} from '../api/returns';
import { getMyReviews, createReview } from '../api/reviews';
import { askAIInsights } from '../api/aiInsights';

// Ordered delivery lifecycle used to show customers their current order progress.
const ORDER_TRACKING_STEPS = [
  'PLACED', 'ACCEPTED', 'PREPARING', 'READY',
  'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED',
];


// ==================== FORMAT AI MARKDOWN RESPONSE ====================
// The AI service can return headings, bold text, lists, and Markdown tables.
// This lightweight renderer formats those elements without injecting HTML.
const renderAIInlineText = (text, keyPrefix) => {
  const tokenPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
};

// Convert a pipe-separated Markdown row into individual table cells.
const getAITableCells = (line) => {
  const cleanedLine = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return cleanedLine.split('|').map((cell) => cell.trim());
};

// Render common Markdown structures returned by the AI as readable React UI.
const renderAIAnswer = (answer) => {
  const lines = answer.split(/\r?\n/);
  const elements = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    // Ignore blank lines between Markdown blocks.
    if (!line) {
      index += 1;
      continue;
    }

    // ==================== MARKDOWN TABLE ====================
    // A table starts with a pipe-separated header followed by a separator row.
    if (
      line.includes('|') &&
      index + 1 < lines.length &&
      /^\|?\s*:?-{3,}/.test(lines[index + 1].trim())
    ) {
      const headers = getAITableCells(line);
      index += 2; // Skip the header and Markdown separator row.
      const rows = [];

      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(getAITableCells(lines[index]));
        index += 1;
      }

      elements.push(
        <div className="ai-table-wrapper" key={`ai-table-${elements.length}`}>
          <table className="ai-response-table">
            <thead>
              <tr>
                {headers.map((header, cellIndex) => (
                  <th key={`header-${cellIndex}`}>
                    {renderAIInlineText(header, `table-head-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((_, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>
                      {renderAIInlineText(row[cellIndex] || '', `table-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // ==================== MARKDOWN HEADINGS ====================
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const HeadingTag = headingMatch[1].length === 1 ? 'h3' : 'h4';
      elements.push(
        <HeadingTag className="ai-response-heading" key={`heading-${elements.length}`}>
          {renderAIInlineText(headingMatch[2], `heading-${elements.length}`)}
        </HeadingTag>
      );
      index += 1;
      continue;
    }

    // ==================== MARKDOWN BULLET LIST ====================
    if (/^[-*]\s+/.test(line)) {
      const listItems = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const itemText = lines[index].trim().replace(/^[-*]\s+/, '');
        listItems.push(itemText);
        index += 1;
      }

      elements.push(
        <ul className="ai-response-list" key={`list-${elements.length}`}>
          {listItems.map((item, itemIndex) => (
            <li key={`list-item-${itemIndex}`}>
              {renderAIInlineText(item, `list-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ==================== MARKDOWN NUMBERED LIST ====================
    if (/^\d+[.)]\s+/.test(line)) {
      const listItems = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        listItems.push(lines[index].trim().replace(/^\d+[.)]\s+/, ''));
        index += 1;
      }

      elements.push(
        <ol className="ai-response-list" key={`ordered-list-${elements.length}`}>
          {listItems.map((item, itemIndex) => (
            <li key={`ordered-item-${itemIndex}`}>
              {renderAIInlineText(item, `ordered-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // ==================== NORMAL PARAGRAPH ====================
    // Keep adjacent non-empty lines together as one paragraph.
    const paragraphLines = [line];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim()) &&
      !(
        lines[index].includes('|') &&
        index + 1 < lines.length &&
        /^\|?\s*:?-{3,}/.test(lines[index + 1].trim())
      )
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    elements.push(
      <p className="ai-response-paragraph" key={`paragraph-${elements.length}`}>
        {renderAIInlineText(paragraphLines.join(' '), `paragraph-${elements.length}`)}
      </p>
    );
  }

  return <div className="ai-response-content">{elements}</div>;
};

// ==================== CUSTOMER DASHBOARD COMPONENT ====================
function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== DASHBOARD STATE ====================
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ==================== ORDER STATE ====================
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [orderMessage, setOrderMessage] = useState('');

  // ==================== REFUND REQUEST STATE ====================
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [returnsError, setReturnsError] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedRefundOrder, setSelectedRefundOrder] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');

  // ==================== CUSTOMER REVIEW STATE ====================
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [selectedReviewOrder, setSelectedReviewOrder] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // ==================== AI INSIGHTS STATE ====================
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiOrdersAnalyzed, setAiOrdersAnalyzed] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // ==================== FETCH CUSTOMER ORDERS ====================
  // Backend: GET /api/v1/orders/my
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');

      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      setOrdersError(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to load your orders. Please try again.'
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ==================== FETCH CUSTOMER REFUND REQUESTS ====================
  // Backend: GET /api/v1/returns/my
  const fetchReturnRequests = useCallback(async () => {
    try {
      setReturnsLoading(true);
      setReturnsError('');

      const data = await getMyReturnRequests();
      setReturnRequests(data);
    } catch (error) {
      setReturnsError(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to load refund requests.'
      );
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  // ==================== FETCH CUSTOMER REVIEWS ====================
  // Backend: GET /api/v1/reviews/my
  const fetchMyReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');

      const data = await getMyReviews();
      setReviews(data);
    } catch (error) {
      setReviewsError(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to load your reviews.'
      );
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // If checkout just completed, open My Orders and show the new order number.
  useEffect(() => {
    if (location.state?.orderPlaced) {
      setActiveSection('orders');
      setOrderMessage(`Order #${location.state.orderId} was placed successfully. You can track its progress below.`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // ==================== LOAD DASHBOARD DATA ====================
  // Fetch orders and refund requests when the dashboard opens.
  useEffect(() => {
    fetchOrders();
    fetchReturnRequests();
    fetchMyReviews();
  }, [fetchOrders, fetchReturnRequests, fetchMyReviews]);

  // ==================== CANCEL CUSTOMER ORDER ====================
  // Backend: PATCH /api/v1/orders/{order_id}/cancel
  // The backend checks that the order is still in PLACED status.
  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${orderId}?`
    );

    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);
      setOrderMessage('');

      await cancelMyOrder(orderId);

      setOrderMessage(`Order #${orderId} was cancelled successfully.`);

      // Refresh the order history after cancellation.
      await fetchOrders();
    } catch (error) {
      setOrderMessage(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to cancel this order. Please try again.'
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  // ==================== SUBMIT CUSTOMER REFUND REQUEST ====================
  // Backend: POST /api/v1/returns/orders/{order_id}
  const handleRefundSubmit = async (event) => {
    event.preventDefault();

    // Validate the selected order and reason before calling the API.
    if (!selectedRefundOrder || refundReason.trim().length < 5) {
      setRefundMessage(
        'Please select an order and enter a reason of at least 5 characters.'
      );
      return;
    }

    try {
      setRefundSubmitting(true);
      setRefundMessage('');

      await createReturnRequest(
        Number(selectedRefundOrder),
        refundReason.trim()
      );

      setRefundMessage(
        'Your refund request was submitted successfully.'
      );

      // Clear the form after successful submission.
      setRefundReason('');
      setSelectedRefundOrder('');

      // Refresh both lists to reflect the latest backend data.
      await Promise.all([
        fetchReturnRequests(),
        fetchOrders(),
      ]);
    } catch (error) {
      setRefundMessage(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to submit your refund request.'
      );
    } finally {
      setRefundSubmitting(false);
    }
  };

  // ==================== SUBMIT CUSTOMER REVIEW ====================
  // Backend: POST /api/v1/reviews/orders/{order_id}
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!selectedReviewOrder) {
      setReviewMessage('Please select a delivered order to review.');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewMessage('Please select a rating between 1 and 5 stars.');
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewMessage('');

      await createReview(
        Number(selectedReviewOrder),
        reviewRating,
        reviewComment
      );

      setReviewMessage('Your review was submitted successfully.');
      setSelectedReviewOrder('');
      setReviewRating(5);
      setReviewComment('');

      // Refresh reviews and orders so the reviewed order is no longer eligible.
      await Promise.all([fetchMyReviews(), fetchOrders()]);
    } catch (error) {
      setReviewMessage(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Unable to submit your review. Please try again.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ==================== ASK CAMPUSBITE AI INSIGHTS ====================
  // Backend: POST /api/v1/ai-insights/ask
  // The backend analyzes only the logged-in customer's order history.
  const handleAIQuestionSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuestion = aiQuestion.trim();

    // Match the backend schema: question must contain 3 to 500 characters.
    if (trimmedQuestion.length < 3 || trimmedQuestion.length > 500) {
      setAiError('Please enter a question between 3 and 500 characters.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError('');
      setAiAnswer('');
      setAiOrdersAnalyzed(null);

      const result = await askAIInsights(trimmedQuestion);

      if (!result.success) {
        throw new Error('The AI service could not generate an answer.');
      }

      setAiAnswer(result.answer);
      setAiOrdersAnalyzed(result.orders_analyzed);
    } catch (error) {
      setAiError(
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        error.message ||
        'Unable to get an AI answer. Please try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ==================== FIND ORDERS ELIGIBLE FOR REFUND ====================
  // Customers can request refunds only for delivered orders.
  // Orders with an existing refund request cannot be submitted again.
  const eligibleRefundOrders = orders.filter((order) => {
    const alreadyRequested = returnRequests.some(
      (request) => Number(request.order_id) === Number(order.id)
    );

    return order.status === 'DELIVERED' && !alreadyRequested;
  });

  // ==================== FIND ORDERS ELIGIBLE FOR REVIEW ====================
  // Only delivered orders without an existing review can be selected.
  const eligibleReviewOrders = orders.filter((order) => {
    const alreadyReviewed = reviews.some(
      (review) => Number(review.order_id) === Number(order.id)
    );

    return order.status === 'DELIVERED' && !alreadyReviewed;
  });

  // ==================== REFUND STATUS DISPLAY ====================
  // Assign a visual class and icon based on the backend request status.
  const getRefundStatusDetails = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return {
          label: 'Approved',
          className: 'status-approved',
          icon: CheckCircle,
        };

      case 'REJECTED':
        return {
          label: 'Rejected',
          className: 'status-rejected',
          icon: XCircle,
        };

      default:
        return {
          label: 'Pending',
          className: 'status-pending',
          icon: Clock,
        };
    }
  };

  // ==================== SIDEBAR NAVIGATION ====================
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'returns', label: 'Refund Requests', icon: RotateCcw },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'profile', label: 'My Profile', icon: UserRound },
  ];

  // ==================== LOGOUT ====================
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Identify the currently selected sidebar item.
  const activeItem = navigationItems.find(
    (item) => item.id === activeSection
  );

  // ==================== DASHBOARD UI ====================
  return (
    <div className="customer-dashboard">

      {/* ==================== SIDEBAR ==================== */}
      <aside
        className={`customer-sidebar ${
          mobileMenuOpen ? 'sidebar-open' : ''
        }`}
      >
        <Link to="/" className="customer-brand">
          <span className="customer-brand-icon">
            <Utensils size={23} />
          </span>
          <span>
            Campus<span>Bite</span>
            <small>GOOD FOOD. GOOD MOOD.</small>
          </span>
        </Link>

        <div className="sidebar-label">CUSTOMER MENU</div>

        {/* Dashboard navigation buttons. */}
        <nav className="customer-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`customer-nav-item ${
                  activeSection === item.id ? 'customer-nav-active' : ''
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                  setOrderMessage('');
                  setRefundMessage('');
                  setReviewMessage('');
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar logout and customer information. */}
        <div className="sidebar-bottom">
          <button
            className="customer-nav-item logout-item"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>

          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>

            <div className="sidebar-user-info">
              <strong>{user?.full_name || 'Customer'}</strong>
              <span>Customer Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay. */}
      {mobileMenuOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* ==================== MAIN DASHBOARD ==================== */}
      <main className="customer-main">

        {/* Dashboard top navigation. */}
        <header className="customer-topbar">
          <button
            className="dashboard-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle dashboard menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div>
            <span className="topbar-label">CUSTOMER DASHBOARD</span>
            <h1>{activeItem?.label || 'Overview'}</h1>
          </div>

          <Link to="/" className="back-home-link">
            <Utensils size={17} />
            Browse food
          </Link>
        </header>

        <section className="dashboard-content">

          {/* ==================== OVERVIEW SECTION ==================== */}
          {activeSection === 'overview' && (
            <>
              <div className="welcome-section">
                <div>
                  <span className="welcome-eyebrow">
                    YOUR CAMPUS FOOD SPACE
                  </span>

                  <h2>
                    Welcome back, {user?.full_name?.split(' ')[0] || 'Foodie'}!
                    <span> 👋</span>
                  </h2>

                  <p>
                    Manage your orders and enjoy your favourite campus meals.
                  </p>
                </div>

                <div className="welcome-decoration">
                  <Utensils size={46} />
                </div>
              </div>

              {/* Dashboard statistics from actual customer data. */}
              <div className="dashboard-stats">
                <article className="dashboard-stat-card">
                  <span className="stat-icon orders-stat-icon">
                    <ShoppingBag size={21} />
                  </span>

                  <span className="stat-card-label">Total Orders</span>
                  <strong>{ordersLoading ? '...' : orders.length}</strong>
                  <small>Your order history</small>
                </article>

                <article className="dashboard-stat-card">
                  <span className="stat-icon returns-stat-icon">
                    <RotateCcw size={21} />
                  </span>

                  <span className="stat-card-label">Refund Requests</span>
                  <strong>
                    {returnsLoading ? '...' : returnRequests.length}
                  </strong>
                  <small>Track your requests</small>
                </article>

                <article className="dashboard-stat-card">
                  <span className="stat-icon reviews-stat-icon">
                    <Star size={21} />
                  </span>

                  <span className="stat-card-label">My Reviews</span>
                  <strong>{reviewsLoading ? '...' : reviews.length}</strong>
                  <small>Your submitted reviews</small>
                </article>
              </div>

              <div className="dashboard-placeholder-card">
                <div className="placeholder-icon">
                  <Sparkles size={25} />
                </div>

                <div>
                  <h3>Your CampusBite dashboard</h3>
                  <p>
                    Your account is ready. Your order history and refund
                    requests, and reviews are connected to the backend.
                    You can also ask AI Insights questions about your order history.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ==================== ORDER HISTORY SECTION ==================== */}
          {activeSection === 'orders' && (
            <div className="orders-section">

              <div className="orders-section-heading">
                <div>
                  <h2>Order History</h2>
                  <p>View your previous and current orders.</p>
                </div>

                <span>{orders.length} orders</span>
              </div>

              {/* Order success and cancellation messages. */}
              {orderMessage && (
                <div className="order-action-message">
                  {orderMessage}
                </div>
              )}

              {/* Loading, error and empty states. */}
              {ordersLoading ? (
                <div className="orders-message">
                  Loading your orders...
                </div>
              ) : ordersError ? (
                <div className="orders-message orders-error">
                  {ordersError}
                  <button onClick={fetchOrders}>Try again</button>
                </div>
              ) : orders.length === 0 ? (
                <div className="orders-message">
                  <ShoppingBag size={32} />
                  <h3>No orders yet</h3>
                  <p>Your orders will appear here when you place them.</p>

                  <Link to="/" className="browse-orders-link">
                    Browse restaurants
                  </Link>
                </div>
              ) : (

                /* Display actual orders retrieved from the backend. */
                <div className="orders-list">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>

                      {/* Order number, restaurant and current status. */}
                      <div className="order-card-header">
                        <div>
                          <span className="order-number">
                            ORDER #{order.id}
                          </span>

                          <h3>Restaurant #{order.restaurant_id}</h3>
                        </div>

                        <span
                          className={`order-status status-${order.status?.toLowerCase()}`}
                        >
                          {order.status?.replaceAll('_', ' ')}
                        </span>
                      </div>

                      {/* Order date and item count. */}
                      <div className="order-card-details">
                        <span>
                          {new Date(order.created_at).toLocaleString()}
                        </span>

                        <span>
                          {order.order_items?.length || 0} items
                        </span>
                      </div>

                      {/* Visual order tracking. Cancelled/refunded orders show a terminal state. */}
                      {(order.status === 'CANCELLED' || order.status === 'REFUNDED') ? (
                        <div className="customer-order-cancelled-tracker">
                          <Ban size={16} /> {order.status === 'REFUNDED' ? 'This order has been refunded.' : 'This order was cancelled.'}
                        </div>
                      ) : (
                        <div className="customer-order-tracker" aria-label={`Order progress: ${order.status}`}>
                          {ORDER_TRACKING_STEPS.map((step, stepIndex) => {
                            const currentIndex = ORDER_TRACKING_STEPS.indexOf(order.status);
                            const isComplete = currentIndex >= stepIndex;
                            const isCurrent = currentIndex === stepIndex;
                            return (
                              <div className={`customer-tracking-step ${isComplete ? 'tracking-complete' : ''} ${isCurrent ? 'tracking-current' : ''}`} key={step}>
                                <span className="customer-tracking-dot">{isComplete ? '✓' : stepIndex + 1}</span>
                                <small>{step.replaceAll('_', ' ')}</small>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Purchased menu items. */}
                      <div className="order-items-list">
                        {order.order_items?.map((item) => (
                          <div className="order-item-row" key={item.id}>
                            <span>
                              {item.item_name} × {item.quantity}
                            </span>

                            <strong>
                              ₹{Number(item.subtotal).toFixed(2)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {/* Payment status and total amount. */}
                      <div className="order-card-footer">
                        <div>
                          <span>Payment: </span>
                          <strong>{order.payment_status}</strong>
                        </div>

                        <div className="order-total">
                          Total: ₹{Number(order.total_amount).toFixed(2)}
                        </div>
                      </div>

                      {/* Only PLACED orders can be cancelled. */}
                      {order.status === 'PLACED' && (
                        <div className="order-actions">
                          <button
                            className="cancel-order-button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId !== null}
                          >
                            <Ban size={16} />

                            {cancellingOrderId === order.id
                              ? 'Cancelling...'
                              : 'Cancel Order'}
                          </button>
                        </div>
                      )}

                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== REFUND REQUESTS SECTION ==================== */}
          {activeSection === 'returns' && (
            <div className="orders-section">

              {/* Refund section heading. */}
              <div className="orders-section-heading">
                <div>
                  <h2>Refund Requests</h2>
                  <p>
                    Submit a refund request for a delivered order and
                    track its progress.
                  </p>
                </div>

                <span>{returnRequests.length} requests</span>
              </div>

              {/* ==================== NEW REFUND REQUEST FORM ==================== */}
              <div className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">REQUEST A REFUND</span>
                    <h3>Need help with an order?</h3>
                  </div>

                  <RotateCcw size={24} />
                </div>

                <p>
                  Select a delivered order and explain why you are
                  requesting a refund.
                </p>

                {refundMessage && (
                  <div className="order-action-message">
                    {refundMessage}
                  </div>
                )}

                {returnsLoading || ordersLoading ? (
                  <div className="orders-message">
                    Loading your orders and refund requests...
                  </div>
                ) : returnsError || ordersError ? (
                  <div className="orders-message orders-error">
                    {returnsError || ordersError}

                    <button
                      onClick={() => {
                        fetchOrders();
                        fetchReturnRequests();
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : eligibleRefundOrders.length === 0 ? (
                  <div className="orders-message">
                    <ShoppingBag size={30} />
                    <h3>No eligible orders</h3>
                    <p>
                      You can request a refund only for delivered orders
                      that do not already have a refund request.
                    </p>
                  </div>
                ) : (
                  <form
                    className="refund-request-form"
                    onSubmit={handleRefundSubmit}
                  >
                    {/* Select a delivered order without an existing request. */}
                    <div className="refund-form-group">
                      <label htmlFor="refund-order">
                        Select Delivered Order
                      </label>

                      <select
                        id="refund-order"
                        value={selectedRefundOrder}
                        onChange={(event) =>
                          setSelectedRefundOrder(event.target.value)
                        }
                        required
                      >
                        <option value="">Choose an order</option>

                        {eligibleRefundOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            Order #{order.id} - ₹
                            {Number(order.total_amount).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Customer must provide a reason of at least 5 characters. */}
                    <div className="refund-form-group">
                      <label htmlFor="refund-reason">
                        Reason for Refund
                      </label>

                      <textarea
                        id="refund-reason"
                        rows="4"
                        value={refundReason}
                        onChange={(event) =>
                          setRefundReason(event.target.value)
                        }
                        placeholder="Please explain why you are requesting a refund..."
                        minLength={5}
                        required
                      />

                      <small>
                        Minimum 5 characters required.
                      </small>
                    </div>

                    {/* Submit the refund request to the backend. */}
                    <button
                      type="submit"
                      className="cancel-order-button"
                      disabled={refundSubmitting}
                    >
                      <Send size={16} />

                      {refundSubmitting
                        ? 'Submitting...'
                        : 'Submit Refund Request'}
                    </button>
                  </form>
                )}
              </div>

              {/* ==================== REFUND REQUEST HISTORY ==================== */}
              <div className="orders-section-heading">
                <div>
                  <h2>Your Requests</h2>
                  <p>Check the latest status of your refund requests.</p>
                </div>
              </div>

              {/* Refund request loading and error states. */}
              {returnsLoading ? (
                <div className="orders-message">
                  Loading refund requests...
                </div>
              ) : returnsError ? (
                <div className="orders-message orders-error">
                  {returnsError}
                  <button onClick={fetchReturnRequests}>
                    Try again
                  </button>
                </div>
              ) : returnRequests.length === 0 ? (
                <div className="orders-message">
                  <RotateCcw size={32} />
                  <h3>No refund requests yet</h3>
                  <p>
                    Any refund requests you submit will appear here.
                  </p>
                </div>
              ) : (
                /* Display actual refund requests returned by the backend. */
                <div className="orders-list">
                  {returnRequests.map((request) => {
                    const statusDetails = getRefundStatusDetails(
                      request.status
                    );

                    const StatusIcon = statusDetails.icon;

                    return (
                      <article
                        className="order-card"
                        key={request.id}
                      >
                        {/* Refund request number and current status. */}
                        <div className="order-card-header">
                          <div>
                            <span className="order-number">
                              REFUND REQUEST #{request.id}
                            </span>

                            <h3>Order #{request.order_id}</h3>
                          </div>

                          <span
                            className={`order-status ${statusDetails.className}`}
                          >
                            <StatusIcon size={14} />
                            {statusDetails.label}
                          </span>
                        </div>

                        {/* Request reason. */}
                        <div className="order-card-details">
                          <span>
                            Submitted:{' '}
                            {new Date(request.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="order-items-list">
                          <div className="order-item-row">
                            <span>Reason</span>
                            <strong>{request.reason}</strong>
                          </div>

                          {/* Show the owner's response if one exists. */}
                          {request.owner_response && (
                            <div className="order-item-row">
                              <span>Owner response</span>
                              <strong>{request.owner_response}</strong>
                            </div>
                          )}

                          {request.reviewed_at && (
                            <div className="order-item-row">
                              <span>Reviewed on</span>
                              <strong>
                                {new Date(
                                  request.reviewed_at
                                ).toLocaleString()}
                              </strong>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== MY REVIEWS SECTION ==================== */}
          {activeSection === 'reviews' && (
            <div className="orders-section">
              {/* Reviews section heading. */}
              <div className="orders-section-heading">
                <div>
                  <h2>My Reviews</h2>
                  <p>Share your experience and see the reviews you have submitted.</p>
                </div>
                <span>{reviews.length} reviews</span>
              </div>

              {/* ==================== WRITE A REVIEW FORM ==================== */}
              <div className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">SHARE YOUR EXPERIENCE</span>
                    <h3>How was your order?</h3>
                  </div>
                  <Star size={24} />
                </div>

                <p>Select a delivered order, choose a star rating, and optionally leave a comment.</p>

                {reviewMessage && (
                  <div className="order-action-message">{reviewMessage}</div>
                )}

                {reviewsLoading || ordersLoading ? (
                  <div className="orders-message">Loading your orders and reviews...</div>
                ) : reviewsError || ordersError ? (
                  <div className="orders-message orders-error">
                    {reviewsError || ordersError}
                    <button onClick={() => { fetchOrders(); fetchMyReviews(); }}>
                      Try again
                    </button>
                  </div>
                ) : eligibleReviewOrders.length === 0 ? (
                  <div className="orders-message">
                    <Star size={30} />
                    <h3>No eligible orders</h3>
                    <p>You can review an order after it is delivered. Each order can be reviewed only once.</p>
                  </div>
                ) : (
                  <form className="review-request-form" onSubmit={handleReviewSubmit}>
                    {/* Select a delivered order that has not already been reviewed. */}
                    <div className="refund-form-group">
                      <label htmlFor="review-order">Select Delivered Order</label>
                      <select
                        id="review-order"
                        value={selectedReviewOrder}
                        onChange={(event) => setSelectedReviewOrder(event.target.value)}
                        required
                      >
                        <option value="">Choose an order</option>
                        {eligibleReviewOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            Order #{order.id} - ₹{Number(order.total_amount).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Customer rating: the backend accepts integer values from 1 to 5. */}
                    <div className="refund-form-group">
                      <label>Rating</label>
                      <div className="review-star-picker" role="group" aria-label="Choose a rating from 1 to 5 stars">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            className={`review-star-button ${starValue <= reviewRating ? 'selected' : ''}`}
                            onClick={() => setReviewRating(starValue)}
                            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                            aria-pressed={reviewRating === starValue}
                          >
                            <Star size={28} fill={starValue <= reviewRating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                        <span>{reviewRating} / 5</span>
                      </div>
                    </div>

                    {/* Comment is optional according to ReviewCreate schema. */}
                    <div className="refund-form-group">
                      <label htmlFor="review-comment">Comment (Optional)</label>
                      <textarea
                        id="review-comment"
                        rows="4"
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        placeholder="Tell us about your food and delivery experience..."
                      />
                    </div>

                    {/* Submit the review to the backend. */}
                    <button type="submit" className="cancel-order-button" disabled={reviewSubmitting}>
                      <Send size={16} />
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>

              {/* ==================== CUSTOMER REVIEW HISTORY ==================== */}
              <div className="orders-section-heading">
                <div>
                  <h2>Your Reviews</h2>
                  <p>Reviews you have already submitted.</p>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="orders-message">Loading your reviews...</div>
              ) : reviewsError ? (
                <div className="orders-message orders-error">
                  {reviewsError}
                  <button onClick={fetchMyReviews}>Try again</button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="orders-message">
                  <Star size={32} />
                  <h3>No reviews yet</h3>
                  <p>Your submitted reviews will appear here.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {reviews.map((review) => (
                    <article className="order-card" key={review.id}>
                      <div className="order-card-header">
                        <div>
                          <span className="order-number">REVIEW #{review.id}</span>
                          <h3>Order #{review.order_id}</h3>
                        </div>
                        <span className="review-rating-display">
                          <Star size={15} fill="currentColor" /> {review.rating} / 5
                        </span>
                      </div>

                      <div className="review-stars-readonly" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <Star
                            key={starValue}
                            size={17}
                            fill={starValue <= review.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>

                      <div className="order-card-details">
                        <span>Submitted: {new Date(review.created_at).toLocaleString()}</span>
                      </div>

                      <div className="order-items-list">
                        <div className="order-item-row">
                          <span>Comment</span>
                          <strong>{review.comment || 'No comment provided.'}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== AI INSIGHTS SECTION ==================== */}
          {activeSection === 'insights' && (
            <div className="orders-section">
              {/* AI Insights heading and explanation. */}
              <div className="orders-section-heading">
                <div>
                  <h2>CampusBite AI Insights</h2>
                  <p>Ask questions about your order history and spending.</p>
                </div>
                <span><Sparkles size={15} /> AI Assistant</span>
              </div>

              {/* Suggested questions help customers get started. */}
              <div className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">YOUR PERSONAL ORDER ASSISTANT</span>
                    <h3>What would you like to know?</h3>
                  </div>
                  <Sparkles size={24} />
                </div>

                <p>
                  Ask about your previous orders. Answers are generated using
                  your own order history.
                </p>

                <div className="ai-suggested-questions">
                  <span className="stat-card-label">SUGGESTED QUESTIONS</span>
                  {[
                    'Which restaurant have I ordered from the most?',
                    'How much have I spent on food?',
                    'What are my most ordered items?',
                    'Summarize my recent orders.',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="ai-suggestion-button"
                      onClick={() => {
                        setAiQuestion(suggestion);
                        setAiError('');
                      }}
                      disabled={aiLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Submit a question to the existing AI backend. */}
                <form className="review-request-form" onSubmit={handleAIQuestionSubmit}>
                  <div className="refund-form-group">
                    <label htmlFor="ai-question">Your question</label>
                    <textarea
                      id="ai-question"
                      rows="4"
                      value={aiQuestion}
                      onChange={(event) => setAiQuestion(event.target.value)}
                      placeholder="For example: Which restaurant do I order from most?"
                      minLength={3}
                      maxLength={500}
                      required
                      disabled={aiLoading}
                    />
                    <small>{aiQuestion.length}/500 characters (minimum 3)</small>
                  </div>

                  {aiError && (
                    <div className="order-action-message">{aiError}</div>
                  )}

                  <button
                    type="submit"
                    className="cancel-order-button"
                    disabled={aiLoading || aiQuestion.trim().length < 3}
                  >
                    <Sparkles size={16} />
                    {aiLoading ? 'Analyzing your orders...' : 'Ask AI Insights'}
                  </button>
                </form>
              </div>

              {/* Display the answer returned by the backend. */}
              {aiLoading && (
                <div className="orders-message">
                  <Sparkles size={22} />
                  Analyzing your order history. This may take a few seconds...
                </div>
              )}

              {aiAnswer && !aiLoading && (
                <article className="order-card ai-answer-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-number">CAMPUSBITE AI RESPONSE</span>
                      <h3>Your order insights</h3>
                    </div>
                    <Sparkles size={23} />
                  </div>

                  {renderAIAnswer(aiAnswer)}

                  <div className="order-card-details">
                    <span>Orders analyzed: {aiOrdersAnalyzed ?? 0}</span>
                  </div>
                </article>
              )}

              {/* Explain why an answer may have limited information. */}
              <p className="ai-privacy-note">
                CampusBite AI uses your order history to answer questions. It
                will tell you when the requested information is unavailable.
              </p>
            </div>
          )}

          {/* ==================== MY PROFILE SECTION ==================== */}
          {activeSection === 'profile' && (
            <div className="orders-section">
              {/* Profile heading and explanation. */}
              <div className="orders-section-heading">
                <div>
                  <h2>My Profile</h2>
                  <p>View the account information associated with your CampusBite account.</p>
                </div>
                <span>View only</span>
              </div>

              {/* Display profile information from AuthContext.
                  AuthContext loads this data from GET /api/v1/auth/me. */}
              <article className="order-card customer-profile-card">
                <div className="customer-profile-heading">
                  <div className="customer-profile-avatar">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <span className="order-number">CUSTOMER ACCOUNT</span>
                    <h3>{user?.full_name || 'Name unavailable'}</h3>
                    <p>Your CampusBite profile details</p>
                  </div>
                </div>

                <div className="customer-profile-details">
                  <div className="customer-profile-detail">
                    <span>Customer ID</span>
                    <strong>{user?.id ?? 'Unavailable'}</strong>
                  </div>

                  <div className="customer-profile-detail">
                    <span>Full Name</span>
                    <strong>{user?.full_name || 'Unavailable'}</strong>
                  </div>

                  <div className="customer-profile-detail">
                    <span>Email Address</span>
                    <strong>{user?.email || 'Unavailable'}</strong>
                  </div>

                  <div className="customer-profile-detail">
                    <span>Account Role</span>
                    <strong>{user?.role || 'CUSTOMER'}</strong>
                  </div>
                </div>

                <p className="customer-profile-note">
                  Your profile is currently view-only. Profile editing is not available yet.
                </p>
              </article>
            </div>
          )}

          {/* ==================== OTHER DASHBOARD SECTIONS ==================== */}
          {activeSection !== 'overview' &&
            activeSection !== 'orders' &&
            activeSection !== 'returns' &&
            activeSection !== 'reviews' &&
            activeSection !== 'insights' &&
            activeSection !== 'profile' && (
              <div className="dashboard-placeholder-card section-placeholder">
                <div className="placeholder-icon">
                  {activeItem && <activeItem.icon size={25} />}
                </div>

                <div>
                  <h3>{activeItem?.label}</h3>
                  <p>
                    This section will be connected to the CampusBite backend
                    in an upcoming step.
                  </p>
                </div>
              </div>
            )}

        </section>
      </main>
    </div>
  );
}

export default CustomerDashboard;