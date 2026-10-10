const { useState, useEffect, useRef } = React;

function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tableserve_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tableserve_token') || null);

  // Core Data State
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');

  // Selected Entities & Modals
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [reservingRestaurant, setReservingRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');

  // User History
  const [userOrders, setUserOrders] = useState([]);
  const [userReservations, setUserReservations] = useState([]);

  // Modal Visibility
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [authError, setAuthError] = useState('');

  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState('RESTAURANTS'); // RESTAURANTS, MENUS, KITCHEN

  // Reservation Modal Form State
  const [resDate, setResDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [resSlot, setResSlot] = useState('19:00');
  const [resGuests, setResGuests] = useState(2);
  const [resSpecialRequests, setResSpecialRequests] = useState('');
  const [resFeedback, setResFeedback] = useState(null);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);

  // Amazon Lex Chatbot State
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hi there! I'm your TABLESERVE dining assistant powered by Amazon Lex. How can I help you today?",
      intent: 'GreetingIntent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize and load restaurants
  useEffect(() => {
    fetchRestaurants();
  }, [activeCuisine, searchQuery, dietaryFilter, priceFilter, minRatingFilter]);

  // Load user data on auth change
  useEffect(() => {
    if (token) {
      fetchUserReservations();
      fetchUserOrders();
    }
  }, [token]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatbot]);

  // Fetch Restaurants via Search Service
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCuisine !== 'All') params.append('cuisine', activeCuisine);
      if (searchQuery) params.append('q', searchQuery);
      if (dietaryFilter) params.append('dietary', dietaryFilter);
      if (priceFilter) params.append('priceTier', priceFilter);
      if (minRatingFilter) params.append('minRating', minRatingFilter);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User Reservations
  const fetchUserReservations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUserReservations(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch User Orders
  const fetchUserOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUserOrders(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Check Availability for selected restaurant and date
  const checkAvailability = async (restId, date, guests) => {
    try {
      const res = await fetch(`/api/reservations/availability?restaurant_id=${restId}&date=${date}&guests=${guests}`);
      const data = await res.json();
      if (data.success) {
        setAvailabilitySlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open reservation modal
  const handleOpenReservation = (restaurant) => {
    setReservingRestaurant(restaurant);
    setResFeedback(null);
    checkAvailability(restaurant.id, resDate, resGuests);
  };

  // Open restaurant detail modal
  const handleOpenRestaurant = async (restaurant) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRestaurant(data.data);
      } else {
        setSelectedRestaurant(restaurant);
      }
    } catch {
      setSelectedRestaurant(restaurant);
    }
  };

  // Auth Functions
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'LOGIN'
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password, role: authForm.role };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('tableserve_user', JSON.stringify(data.user));
      localStorage.setItem('tableserve_token', data.token);
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '', role: 'CUSTOMER' });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tableserve_user');
    localStorage.removeItem('tableserve_token');
    setUserOrders([]);
    setUserReservations([]);
  };

  const handleQuickLogin = async (role) => {
    const creds = role === 'ADMIN'
      ? { email: 'admin@tableserve.com', password: 'Admin@123' }
      : { email: 'john.doe@example.com', password: 'Customer@123' };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('tableserve_user', JSON.stringify(data.user));
        localStorage.setItem('tableserve_token', data.token);
        setShowAuthModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cart Functions
  const addToCart = (item, restaurant) => {
    setCart(prev => {
      // If adding from a different restaurant, reset cart with new item
      if (prev.length > 0 && prev[0].restaurant_id !== restaurant.id) {
        if (!confirm(`Your cart already contains items from another restaurant. Start a new order from ${restaurant.name}?`)) {
          return prev;
        }
        return [{ ...item, quantity: 1, restaurant_name: restaurant.name }];
      }

      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [...prev, { ...item, quantity: 1, restaurant_name: restaurant.name }];
    });
    setShowCartDrawer(true);
  };

  const updateCartQty = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // Submit Reservation
  const handleConfirmReservation = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setResFeedback({ loading: true });
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant_id: reservingRestaurant.id,
          reservation_date: resDate,
          time_slot: resSlot,
          guests: resGuests,
          special_requests: resSpecialRequests
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setResFeedback({
          success: false,
          error: data.error || 'Failed to complete reservation.'
        });
      } else {
        setResFeedback({
          success: true,
          data: data.data,
          sns: data.snsNotification
        });
        fetchUserReservations();
      }
    } catch (err) {
      setResFeedback({ success: false, error: err.message });
    }
  };

  // Cancel Reservation
  const handleCancelReservation = async (reservationId) => {
    if (!confirm('Are you sure you want to cancel this reservation? Your table slot will be released.')) return;
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchUserReservations();
        alert('Reservation cancelled successfully. Table slot released.');
      }
    } catch (err) {
      alert('Error cancelling reservation: ' + err.message);
    }
  };

  // Submit Order & Trigger Payment Modal
  const handleProceedToPayment = () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setShowCartDrawer(false);
    setPaymentData({
      amount: cartTotal,
      reference_type: 'ORDER',
      reference_id: `temp-${Date.now()}`,
      orderPayload: {
        restaurant_id: cart[0].restaurant_id,
        order_type: orderType,
        table_number: orderType === 'DINE_IN' ? tableNumber : null,
        special_notes: specialNotes,
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      }
    });
    setShowPaymentModal(true);
  };

  // Process Simulated Payment
  const handleProcessPayment = async (cardNumber) => {
    try {
      // 1. Create order first
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentData.orderPayload)
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to place order');

      // 2. Simulate payment
      const payRes = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          reference_type: 'ORDER',
          reference_id: orderData.data.id,
          card_number: cardNumber
        })
      });
      const payResult = await payRes.json();

      if (!payRes.ok) {
        return { success: false, error: payResult.error, orderId: orderData.data.id };
      }

      setCart([]);
      fetchUserOrders();
      return { success: true, payment: payResult.data, order: orderData.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Advance Order Status (Admin)
  const handleAdvanceOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchUserOrders();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Send message to Amazon Lex Chatbot
  const handleSendChatMessage = async (presetText = null) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();

      const botMsg = {
        sender: 'bot',
        text: data.reply || "I'm having trouble processing that right now.",
        intent: data.intent,
        actionData: data.actionData,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "⚠️ Sorry, connection error to the dining concierge bot.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const cuisinesList = ['All', 'Italian', 'Japanese', 'Indian', 'French', 'Mexican', 'Steakhouse'];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveCuisine('All'); setSearchQuery(''); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xl">
              🍽️
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                TABLESERVE
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Microservices Platform
              </span>
            </div>
          </div>

          {/* Navigation Links & Action Controls */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {token && (
              <>
                <button
                  onClick={() => setShowReservationsModal(true)}
                  className="hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <span>📅</span>
                  <span>My Bookings</span>
                  {userReservations.length > 0 && (
                    <span className="ml-1 text-xs px-1.5 py-0.2 bg-orange-500 text-white rounded-full font-bold">
                      {userReservations.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowOrdersModal(true)}
                  className="hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <span>🧾</span>
                  <span>Orders</span>
                  {userOrders.length > 0 && (
                    <span className="ml-1 text-xs px-1.5 py-0.2 bg-slate-800 text-white rounded-full font-bold">
                      {userOrders.length}
                    </span>
                  )}
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="flex items-center space-x-1 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>⚡</span>
                    <span>Admin Panel</span>
                  </button>
                )}
              </>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
              title="Shopping Cart"
            >
              <span className="text-xl">🛍️</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white animate-bounce">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-slate-800 truncate max-w-[120px]">{user.name}</p>
                  <p className="text-slate-500 font-medium capitalize">{user.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  title="Log out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('LOGIN'); setShowAuthModal(true); }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-slate-50 border-b border-orange-100/50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-4 tracking-wide uppercase">
            <span>✨ Seamless Dining & Cloud-Ready Microservices</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Reserve Tables. <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Order Gourmet.</span><br />
            Dine Effortlessly.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Experience real-time table booking with strict double-booking prevention, simulated payments, live order tracking, and Amazon Lex conversational AI.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-orange-900/5 border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-3 space-x-2">
              <span className="text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search restaurants, cuisines (Italian, Japanese, Indian), or signature dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>
            <button
              onClick={fetchRestaurants}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md shadow-orange-600/20"
            >
              Search
            </button>
          </div>

          {/* Quick Cuisine Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {cuisinesList.map(c => (
              <button
                key={c}
                onClick={() => setActiveCuisine(c)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                  activeCuisine === c
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200'
                }`}
              >
                {c === 'All' ? '🌟 All Cuisines' : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MULTI-FACETED FILTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>

            {/* Dietary Filter */}
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
            >
              <option value="">🌱 All Dietary Options</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Gluten-Free">Gluten-Free</option>
              <option value="Halal">Halal</option>
            </select>

            {/* Price Tier */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
            >
              <option value="">💲 Any Price Tier</option>
              <option value="$">$ (Under $15)</option>
              <option value="$$">$$ ($15 - $30)</option>
              <option value="$$$">$$$ ($30 - $60)</option>
              <option value="$$$$">$$$$ (Fine Dining)</option>
            </select>

            {/* Rating Filter */}
            <select
              value={minRatingFilter}
              onChange={(e) => setMinRatingFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
            >
              <option value="">⭐ Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.7">4.7+ Stars</option>
              <option value="4.9">4.9+ Top Rated</option>
            </select>

            {(dietaryFilter || priceFilter || minRatingFilter || searchQuery || activeCuisine !== 'All') && (
              <button
                onClick={() => {
                  setDietaryFilter('');
                  setPriceFilter('');
                  setMinRatingFilter('');
                  setSearchQuery('');
                  setActiveCuisine('All');
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold px-2 py-1 rounded hover:bg-orange-50"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-orange-600">{restaurants.length}</span> restaurant{restaurants.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* 4. RESTAURANT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-semibold">Loading top restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <span className="text-5xl">🍽️</span>
            <h3 className="mt-4 text-lg font-bold text-slate-800">No restaurants match your filters</h3>
            <p className="mt-1 text-sm text-slate-500">Try broadening your search or resetting dietary/price filters.</p>
            <button
              onClick={() => {
                setDietaryFilter(''); setPriceFilter(''); setMinRatingFilter(''); setSearchQuery(''); setActiveCuisine('All');
              }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow hover:bg-orange-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map(restaurant => (
              <div
                key={restaurant.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                      {restaurant.cuisine}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {restaurant.price_tier}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <span>★</span>
                    <span>{restaurant.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                      {restaurant.description}
                    </p>

                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate">{restaurant.address}, {restaurant.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>{restaurant.opening_time} - {restaurant.closing_time} • {restaurant.total_tables || 10} Tables</span>
                      </div>
                    </div>

                    {/* Featured Dish Highlights */}
                    {restaurant.featuredDishes && restaurant.featuredDishes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Items:</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {restaurant.featuredDishes.map(d => (
                            <span key={d.id} className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                              {d.name} (${d.price})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenReservation(restaurant)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                    >
                      <span>📅</span>
                      <span>Book Table</span>
                    </button>
                    <button
                      onClick={() => handleOpenRestaurant(restaurant)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <span>📖</span>
                      <span>Menu & Order</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 5. RESTAURANT DETAIL & MENU MODAL */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="relative h-48 bg-slate-900 flex-shrink-0">
              <img
                src={selectedRestaurant.image_url}
                alt={selectedRestaurant.name}
                className="w-full h-full object-cover opacity-60"
              />
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 text-white">
                <span className="text-xs font-bold px-2.5 py-1 bg-orange-500 rounded-full">{selectedRestaurant.cuisine}</span>
                <h2 className="text-2xl font-black mt-1">{selectedRestaurant.name}</h2>
                <p className="text-xs text-slate-200">{selectedRestaurant.address}, {selectedRestaurant.city}</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Restaurant Menu</h3>
                <button
                  onClick={() => {
                    const r = selectedRestaurant;
                    setSelectedRestaurant(null);
                    handleOpenReservation(r);
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200"
                >
                  Switch to Reserve Table →
                </button>
              </div>

              {!selectedRestaurant.menu || selectedRestaurant.menu.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">Menu items are currently being updated.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRestaurant.menu.map(item => (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-200 transition bg-slate-50/50"
                    >
                      <div className="flex gap-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                          {item.dietary_tags && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              {item.dietary_tags}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">${Number(item.price).toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(item, selectedRestaurant)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>Add to Order</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. RESERVATION BOOKING MODAL (DOUBLE-BOOKING VALIDATION) */}
      {reservingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up flex flex-col">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white relative">
              <button
                onClick={() => setReservingRestaurant(null)}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-200">Table Reservation</span>
              <h2 className="text-2xl font-black mt-1">{reservingRestaurant.name}</h2>
              <p className="text-xs text-orange-100">{reservingRestaurant.address}</p>
            </div>

            <div className="p-6 space-y-4">
              {resFeedback?.success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
                    ✓
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-slate-900">Reservation Confirmed!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Assigned <strong>Table #{resFeedback.data.table_number}</strong> on{' '}
                    <strong>{resFeedback.data.reservation_date}</strong> at{' '}
                    <strong>{resFeedback.data.time_slot}</strong> for {resFeedback.data.guests} guests.
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600">
                    <p className="font-bold text-slate-800">🔔 Simulated AWS SNS Confirmation Receipt:</p>
                    <p className="mt-0.5 text-slate-500">Event: {resFeedback.sns?.eventType}</p>
                    <p className="text-slate-500">Booking ID: #{resFeedback.data.id}</p>
                  </div>

                  <button
                    onClick={() => { setReservingRestaurant(null); setShowReservationsModal(true); }}
                    className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    View in My Bookings
                  </button>
                </div>
              ) : (
                <>
                  {resFeedback?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{resFeedback.error}</span>
                    </div>
                  )}

                  {/* Date Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reservation Date</label>
                    <input
                      type="date"
                      value={resDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setResDate(e.target.value);
                        checkAvailability(reservingRestaurant.id, e.target.value, resGuests);
                      }}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Guests Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Number of Guests</label>
                    <div className="flex gap-2">
                      {[1, 2, 4, 6, 8].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setResGuests(num);
                            checkAvailability(reservingRestaurant.id, resDate, num);
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                            resGuests === num
                              ? 'bg-orange-600 text-white border-orange-600 shadow'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Grid with Real-time Availability */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Time Slot</label>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                      {['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(slot => {
                        const slotInfo = availabilitySlots.find(s => s.slot === slot);
                        const isAvailable = slotInfo ? slotInfo.isAvailable : true;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setResSlot(slot)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center ${
                              !isAvailable
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                : resSlot === slot
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-600'
                            }`}
                          >
                            <span>{slot}</span>
                            <span className="text-[9px] font-normal mt-0.5">
                              {isAvailable ? 'Available' : 'Booked'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Requests (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Window table, anniversary celebration..."
                      value={resSpecialRequests}
                      onChange={(e) => setResSpecialRequests(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmReservation}
                    disabled={resFeedback?.loading}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {resFeedback?.loading ? (
                      <span className="animate-spin text-base">⏳</span>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>Lock Table & Confirm</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CART DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCartDrawer(false)}></div>
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up">
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Your Order Cart</h3>
                  <p className="text-xs text-slate-400">
                    {cart.length > 0 ? `Ordering from ${cart[0].restaurant_name}` : 'Cart is currently empty'}
                  </p>
                </div>
                <button onClick={() => setShowCartDrawer(false)} className="text-white hover:text-orange-400 text-lg">✕</button>
              </div>

              {/* Items List */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <span className="text-5xl">🛍️</span>
                    <p className="mt-3 text-sm font-bold text-slate-600">Your cart is empty</p>
                    <p className="text-xs text-slate-400 mt-1">Add items from any restaurant menu to start an order.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                            <span className="text-xs text-slate-500">${Number(item.price).toFixed(2)} each</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
                            >
                              +
                            </button>
                            <span className="text-xs font-black text-slate-900 w-16 text-right">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Details */}
                    <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Dining Option</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setOrderType(type)}
                              className={`py-2 text-[11px] font-bold rounded-lg border transition ${
                                orderType === type
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {type.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {orderType === 'DINE_IN' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Table Number</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes for Kitchen</label>
                        <input
                          type="text"
                          placeholder="e.g. Extra napkins, no cilantro..."
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-600">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2"
                  >
                    <span>💳</span>
                    <span>Checkout & Pay (${cartTotal.toFixed(2)})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. PAYMENT SIMULATION MODAL */}
      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900">💳 Payment Simulation</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-4">
              <span className="text-xs text-orange-700 font-bold">Total Amount Due</span>
              <p className="text-2xl font-black text-orange-900">${Number(paymentData.amount).toFixed(2)}</p>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select one of the mock test cards below to simulate instant payment gateway authorization:
            </p>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  const res = await handleProcessPayment('4242424242424242');
                  if (res.success) {
                    alert(`✅ Payment authorized! Transaction ID: ${res.payment.transaction_id}. Order placed successfully.`);
                    setShowPaymentModal(false);
                    setShowOrdersModal(true);
                  } else {
                    alert('❌ Payment failed: ' + res.error);
                  }
                }}
                className="w-full p-3.5 bg-green-50 hover:bg-green-100 border border-green-300 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-black text-green-900">Test Card: VISA (Approved)</span>
                  <p className="text-[11px] text-green-700 font-mono">•••• •••• •••• 4242</p>
                </div>
                <span className="text-xs bg-green-600 text-white font-bold px-2.5 py-1 rounded-full">Simulate Success</span>
              </button>

              <button
                onClick={async () => {
                  const res = await handleProcessPayment('4000000000000000');
                  alert(`❌ Payment declined as expected! Reason: ${res.error}`);
                }}
                className="w-full p-3.5 bg-red-50 hover:bg-red-100 border border-red-300 rounded-xl text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-black text-red-900">Test Card: DECLINE (Declined)</span>
                  <p className="text-[11px] text-red-700 font-mono">•••• •••• •••• 0000</p>
                </div>
                <span className="text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-full">Simulate Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MY RESERVATIONS MODAL */}
      {showReservationsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900">📅 My Table Reservations</h3>
              <button onClick={() => setShowReservationsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {userReservations.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">You have no active reservations yet.</p>
              ) : (
                userReservations.map(res => (
                  <div key={res.id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{res.restaurant_name}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Date: <strong>{res.reservation_date}</strong> at <strong>{res.time_slot}</strong> • {res.guests} Guests
                        {res.table_number && ` • Table #${res.table_number}`}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {res.id}</span>
                    </div>

                    {res.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelReservation(res.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. MY ORDERS MODAL */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900">🧾 My Orders & Tracking</h3>
              <button onClick={() => setShowOrdersModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {userOrders.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">No orders placed yet.</p>
              ) : (
                userOrders.map(order => (
                  <div key={order.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{order.restaurant_name}</h4>
                        <span className="text-xs text-slate-500">Order #{order.id} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">${Number(order.total_amount).toFixed(2)}</span>
                        <div>
                          <span className={`inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${
                            order.status === 'READY' ? 'bg-green-100 text-green-800' :
                            order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'SERVED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            Status: {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                        {order.items.map(i => (
                          <span key={i.id} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700">
                            {i.quantity}x {i.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. ADMIN DASHBOARD MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Management Control</span>
                <h3 className="text-xl font-black text-slate-900">⚡ TABLESERVE Admin Panel</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Admin Tabs */}
            <div className="flex border-b border-slate-200 mt-3 gap-2">
              {['RESTAURANTS', 'KITCHEN_ORDERS', 'MICROSERVICES'].map(t => (
                <button
                  key={t}
                  onClick={() => setAdminTab(t)}
                  className={`text-xs font-bold py-2 px-4 border-b-2 transition ${
                    adminTab === t ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {adminTab === 'KITCHEN_ORDERS' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Live Kitchen Order Queue</h4>
                  {userOrders.map(order => (
                    <div key={order.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold">#{order.id} - {order.restaurant_name}</span>
                        <p className="text-xs text-slate-500">Current Status: <strong>{order.status}</strong></p>
                      </div>
                      <div className="flex gap-2">
                        {['PLACED', 'PREPARING', 'READY', 'SERVED'].map(st => (
                          <button
                            key={st}
                            onClick={() => handleAdvanceOrderStatus(order.id, st)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                              order.status === st ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'MICROSERVICES' && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Restaurant Service', port: 5001, status: 'Healthy', role: 'Catalog & Tables' },
                    { name: 'Reservation & Payment', port: 5002, status: 'Healthy', role: 'Locks & SNS' },
                    { name: 'Ordering Service', port: 5003, status: 'Healthy', role: 'Pricing & Lifecycle' },
                    { name: 'Search Service', port: 5004, status: 'Healthy', role: 'Full-text & Filter' },
                    { name: 'API Gateway Hub', port: 5000, status: 'Healthy', role: 'Reverse Proxy & Swagger' },
                    { name: 'Amazon Lex Concierge', port: 5000, status: 'Online', role: '8 Intents Runtime' }
                  ].map(srv => (
                    <div key={srv.name} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                        <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                          {srv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Port: {srv.port} • {srv.role}</p>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'RESTAURANTS' && (
                <div>
                  <p className="text-xs text-slate-500 mb-3">Manage registered restaurants across the platform.</p>
                  <div className="space-y-2">
                    {restaurants.map(r => (
                      <div key={r.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">{r.name}</span>
                          <p className="text-[11px] text-slate-500">{r.cuisine} • {r.city} • Rating: {r.rating}★</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 font-mono">ID: {r.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {authMode === 'LOGIN' ? 'Welcome Back' : 'Create New Account'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                    <select
                      value={authForm.role}
                      onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Platform Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition mt-2"
              >
                {authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                1-Click Demo Accounts (For Presentation)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('CUSTOMER')}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  👤 Demo Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ADMIN')}
                  className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition"
                >
                  ⚡ Demo Admin
                </button>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                    setAuthError('');
                  }}
                  className="text-xs text-orange-600 font-bold hover:underline"
                >
                  {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. AMAZON LEX CHATBOT FLOATING WIDGET (8 INTENTS) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showChatbot ? (
          <button
            onClick={() => setShowChatbot(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/30 hover:scale-105 transition duration-200 group"
            title="Chat with TABLESERVE Amazon Lex Bot"
          >
            <span className="text-2xl group-hover:rotate-12 transition">🤖</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </button>
        ) : (
          <div className="w-[360px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-lg shadow-sm">
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                    <span>TABLESERVE Assistant</span>
                    <span className="text-[10px] bg-orange-500/30 text-orange-300 font-mono px-1.5 py-0.2 rounded border border-orange-500/40">
                      Amazon Lex
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">8 Intents NLP Concierge</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-orange-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.intent && msg.sender === 'bot' && (
                      <span className="block mt-1 text-[9px] text-slate-400 font-mono">
                        Intent: {msg.intent}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center space-x-1.5 p-3 bg-white border border-slate-200 rounded-2xl max-w-[80px]">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggested Prompt Chips */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSendChatMessage('Find Italian restaurants')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
              >
                🍝 Find Italian
              </button>
              <button
                onClick={() => handleSendChatMessage('Show menu for Bella Italia')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
              >
                📖 View Menu
              </button>
              <button
                onClick={() => handleSendChatMessage('Check my reservation status')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
              >
                📅 My Status
              </button>
              <button
                onClick={() => handleSendChatMessage('help')}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
              >
                ❓ Help
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Ask about restaurants, menus, reservations..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={() => handleSendChatMessage()}
                disabled={chatLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 14. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2">
          <p className="font-bold text-slate-200 text-sm">
            TABLESERVE • Enterprise Restaurant Reservation and Ordering Platform
          </p>
          <p className="text-slate-500">
            Microservices: Restaurant (5001) | Reservation & Payment (5002) | Ordering (5003) | Search (5004) | Gateway (5000)
          </p>
          <p className="text-slate-600">
            Powered by React, Express, PostgreSQL, Docker, AWS Architecture & Amazon Lex
          </p>
        </div>
      </footer>
    </div>
  );
}

// Render into root element
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
