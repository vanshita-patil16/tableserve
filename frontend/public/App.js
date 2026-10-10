const {
  useState,
  useEffect,
  useRef
} = React;
function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tableserve_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tableserve_token') || null);

  // Core Data State
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
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
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER'
  });
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
  const [chatMessages, setChatMessages] = useState([{
    sender: 'bot',
    text: "👋 Hi there! I'm your TABLESERVE dining assistant powered by Amazon Lex. How can I help you today?",
    intent: 'GreetingIntent',
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize and load restaurants
  useEffect(() => {
    fetchRestaurants();
  }, [activeCuisine, searchQuery, cityFilter, dietaryFilter, priceFilter, minRatingFilter]);

  // Load user data on auth change
  useEffect(() => {
    if (token) {
      fetchUserReservations();
      fetchUserOrders();
    }
  }, [token]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [chatMessages, showChatbot]);

  // Fetch Restaurants via Search Service
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCuisine !== 'All') params.append('cuisine', activeCuisine);
      if (searchQuery) params.append('q', searchQuery);
      if (cityFilter && cityFilter !== 'All Cities') params.append('city', cityFilter);
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
        headers: {
          Authorization: `Bearer ${token}`
        }
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
        headers: {
          Authorization: `Bearer ${token}`
        }
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
  const handleOpenReservation = restaurant => {
    setReservingRestaurant(restaurant);
    setResFeedback(null);
    checkAvailability(restaurant.id, resDate, resGuests);
  };

  // Open restaurant detail modal
  const handleOpenRestaurant = async restaurant => {
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
  const handleAuthSubmit = async e => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'LOGIN' ? {
        email: authForm.email,
        password: authForm.password
      } : {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
        role: authForm.role
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('tableserve_user', JSON.stringify(data.user));
      localStorage.setItem('tableserve_token', data.token);
      setShowAuthModal(false);
      setAuthForm({
        name: '',
        email: '',
        password: '',
        role: 'CUSTOMER'
      });
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
  const handleQuickLogin = async role => {
    const creds = role === 'ADMIN' ? {
      email: 'admin@tableserve.com',
      password: 'Admin@123'
    } : {
      email: 'john.doe@example.com',
      password: 'Customer@123'
    };
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
        return [{
          ...item,
          quantity: 1,
          restaurant_name: restaurant.name
        }];
      }
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [...prev, {
        ...item,
        quantity: 1,
        restaurant_name: restaurant.name
      }];
    });
    setShowCartDrawer(true);
  };
  const updateCartQty = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? {
            ...item,
            quantity: newQty
          } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Submit Reservation
  const handleConfirmReservation = async () => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setResFeedback({
      loading: true
    });
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
      setResFeedback({
        success: false,
        error: err.message
      });
    }
  };

  // Cancel Reservation
  const handleCancelReservation = async reservationId => {
    if (!confirm('Are you sure you want to cancel this reservation? Your table slot will be released.')) return;
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
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
        items: cart.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity
        }))
      }
    });
    setShowPaymentModal(true);
  };

  // Process Simulated Payment
  const handleProcessPayment = async cardNumber => {
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
        return {
          success: false,
          error: payResult.error,
          orderId: orderData.data.id
        };
      }
      setCart([]);
      fetchUserOrders();
      return {
        success: true,
        payment: payResult.data,
        order: orderData.data
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
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
        body: JSON.stringify({
          status: newStatus
        })
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
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend
        })
      });
      const data = await res.json();
      const botMsg = {
        sender: 'bot',
        text: data.reply || "I'm having trouble processing that right now.",
        intent: data.intent,
        actionData: data.actionData,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: "⚠️ Sorry, connection error to the dining concierge bot.",
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }]);
    } finally {
      setChatLoading(false);
    }
  };
  const cuisinesList = ['All', 'North Indian', 'South Indian', 'Biryani & Mughlai', 'Coastal Seafood', 'Rajasthani & Thali', 'Pan-Asian', 'Bengali', 'Street Food & Chaat', 'Modern Indian', 'Continental'];
  const citiesList = ['All Cities', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur', 'Goa', 'Ahmedabad'];
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col min-h-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 cursor-pointer",
    onClick: () => {
      setActiveCuisine('All');
      setSearchQuery('');
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xl"
  }, "🍽️"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"
  }, "TABLESERVE"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200"
  }, "Microservices Platform"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 sm:space-x-5"
  }, token && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowReservationsModal(true),
    className: "hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
  }, /*#__PURE__*/React.createElement("span", null, "📅"), /*#__PURE__*/React.createElement("span", null, "My Bookings"), userReservations.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ml-1 text-xs px-1.5 py-0.2 bg-orange-500 text-white rounded-full font-bold"
  }, userReservations.length)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowOrdersModal(true),
    className: "hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
  }, /*#__PURE__*/React.createElement("span", null, "🧾"), /*#__PURE__*/React.createElement("span", null, "Orders"), userOrders.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ml-1 text-xs px-1.5 py-0.2 bg-slate-800 text-white rounded-full font-bold"
  }, userOrders.length)), user?.role === 'ADMIN' && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAdminModal(true),
    className: "flex items-center space-x-1 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition"
  }, /*#__PURE__*/React.createElement("span", null, "⚡"), /*#__PURE__*/React.createElement("span", null, "Admin Panel"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCartDrawer(true),
    className: "relative p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition",
    title: "Shopping Cart"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl"
  }, "🛍️"), cart.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white animate-bounce"
  }, cart.reduce((sum, i) => sum + i.quantity, 0))), user ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 pl-2 border-l border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase"
  }, user.name.charAt(0)), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:block text-left text-xs"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-slate-800 truncate max-w-[120px]"
  }, user.name), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 font-medium capitalize"
  }, user.role.toLowerCase())), /*#__PURE__*/React.createElement("button", {
    onClick: handleLogout,
    className: "text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition",
    title: "Log out"
  }, "Sign Out")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setAuthMode('LOGIN');
      setShowAuthModal(true);
    },
    className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:shadow transition"
  }, "Sign In")))), /*#__PURE__*/React.createElement("section", {
    className: "relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-slate-50 border-b border-orange-100/50 py-12 md:py-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-4 tracking-wide uppercase"
  }, /*#__PURE__*/React.createElement("span", null, "✨ Seamless Dining & Cloud-Ready Microservices")), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight"
  }, "Reserve Tables. ", /*#__PURE__*/React.createElement("span", {
    className: "bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"
  }, "Order Gourmet."), /*#__PURE__*/React.createElement("br", null), "Dine Effortlessly."), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto"
  }, "Experience real-time table booking with strict double-booking prevention, simulated payments, live order tracking, and Amazon Lex conversational AI."), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-orange-900/5 border border-slate-200 flex flex-col sm:flex-row gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex items-center px-3 space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "🔍"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search restaurants, cuisines (Biryani, North Indian, Seafood), dishes (Dal Bukhara, Dosa), or cities (Delhi, Mumbai, Bengaluru)...",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    className: "w-full text-sm font-medium focus:outline-none bg-transparent"
  }), searchQuery && /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearchQuery(''),
    className: "text-xs text-slate-400 hover:text-slate-600"
  }, "✕")), /*#__PURE__*/React.createElement("button", {
    onClick: fetchRestaurants,
    className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md shadow-orange-600/20"
  }, "Search")), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 flex flex-wrap justify-center gap-2"
  }, cuisinesList.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setActiveCuisine(c),
    className: `text-xs font-bold px-4 py-2 rounded-xl transition ${activeCuisine === c ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200'}`
  }, c === 'All' ? '🌟 All Cuisines' : c))))), /*#__PURE__*/React.createElement("section", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-400 uppercase tracking-wider"
  }, "Filters:"), /*#__PURE__*/React.createElement("select", {
    value: cityFilter,
    onChange: e => setCityFilter(e.target.value),
    className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
  }, citiesList.map(city => /*#__PURE__*/React.createElement("option", {
    key: city,
    value: city === 'All Cities' ? '' : city
  }, "📍 ", city))), /*#__PURE__*/React.createElement("select", {
    value: dietaryFilter,
    onChange: e => setDietaryFilter(e.target.value),
    className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "🌱 All Dietary Options"), /*#__PURE__*/React.createElement("option", {
    value: "Pure Veg"
  }, "Pure Veg"), /*#__PURE__*/React.createElement("option", {
    value: "Vegetarian"
  }, "Vegetarian"), /*#__PURE__*/React.createElement("option", {
    value: "Jain"
  }, "Jain Friendly"), /*#__PURE__*/React.createElement("option", {
    value: "Halal"
  }, "Halal Certified"), /*#__PURE__*/React.createElement("option", {
    value: "Gluten-Free"
  }, "Gluten-Free"), /*#__PURE__*/React.createElement("option", {
    value: "Vegan"
  }, "Vegan")), /*#__PURE__*/React.createElement("select", {
    value: priceFilter,
    onChange: e => setPriceFilter(e.target.value),
    className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "₹ Any Price Tier"), /*#__PURE__*/React.createElement("option", {
    value: "₹"
  }, "₹ (Budget / Street Food)"), /*#__PURE__*/React.createElement("option", {
    value: "₹₹"
  }, "₹₹ (Casual & Mid-Range)"), /*#__PURE__*/React.createElement("option", {
    value: "₹₹₹"
  }, "₹₹₹ (Premium & Signature)"), /*#__PURE__*/React.createElement("option", {
    value: "₹₹₹₹"
  }, "₹₹₹₹ (Luxury & Fine Dining)")), /*#__PURE__*/React.createElement("select", {
    value: minRatingFilter,
    onChange: e => setMinRatingFilter(e.target.value),
    className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "⭐ Any Rating"), /*#__PURE__*/React.createElement("option", {
    value: "4.5"
  }, "4.5+ Stars"), /*#__PURE__*/React.createElement("option", {
    value: "4.7"
  }, "4.7+ Stars"), /*#__PURE__*/React.createElement("option", {
    value: "4.9"
  }, "4.9+ Top Rated")), (cityFilter || dietaryFilter || priceFilter || minRatingFilter || searchQuery || activeCuisine !== 'All') && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCityFilter('');
      setDietaryFilter('');
      setPriceFilter('');
      setMinRatingFilter('');
      setSearchQuery('');
      setActiveCuisine('All');
    },
    className: "text-xs text-orange-600 hover:text-orange-700 font-bold px-2 py-1 rounded hover:bg-orange-50"
  }, "Reset Filters")), /*#__PURE__*/React.createElement("div", {
    className: "text-xs font-bold text-slate-500"
  }, "Showing ", /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600"
  }, restaurants.length), " restaurant", restaurants.length !== 1 ? 's' : ''))), /*#__PURE__*/React.createElement("main", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full"
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 font-semibold"
  }, "Loading top restaurants...")) : restaurants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-5xl"
  }, "🍽️"), /*#__PURE__*/React.createElement("h3", {
    className: "mt-4 text-lg font-bold text-slate-800"
  }, "No restaurants match your filters"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-sm text-slate-500"
  }, "Try broadening your search or resetting dietary/price filters."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setDietaryFilter('');
      setPriceFilter('');
      setMinRatingFilter('');
      setSearchQuery('');
      setActiveCuisine('All');
    },
    className: "mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow hover:bg-orange-700"
  }, "Clear All Filters")) : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, restaurants.map(restaurant => /*#__PURE__*/React.createElement("div", {
    key: restaurant.id,
    className: "bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-48 overflow-hidden bg-slate-100"
  }, /*#__PURE__*/React.createElement("img", {
    src: restaurant.image_url,
    alt: restaurant.name,
    className: "w-full h-full object-cover group-hover:scale-105 transition duration-500",
    loading: "lazy"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 flex gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-white/90 backdrop-blur-md text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm"
  }, restaurant.cuisine), /*#__PURE__*/React.createElement("span", {
    className: "bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full"
  }, restaurant.price_tier)), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "★"), /*#__PURE__*/React.createElement("span", null, restaurant.rating))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 flex-1 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold text-slate-900 group-hover:text-orange-600 transition"
  }, restaurant.name), /*#__PURE__*/React.createElement("p", {
    className: "mt-1.5 text-xs text-slate-500 line-clamp-2"
  }, restaurant.description), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-1 text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "📍"), /*#__PURE__*/React.createElement("span", {
    className: "truncate"
  }, restaurant.address, ", ", restaurant.city)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "🕒"), /*#__PURE__*/React.createElement("span", null, restaurant.opening_time, " - ", restaurant.closing_time, " • ", restaurant.total_tables || 10, " Tables"))), restaurant.featuredDishes && restaurant.featuredDishes.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 pt-3 border-t border-slate-100"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider"
  }, "Popular Items:"), /*#__PURE__*/React.createElement("div", {
    className: "mt-1 flex flex-wrap gap-1.5"
  }, restaurant.featuredDishes.map(d => /*#__PURE__*/React.createElement("span", {
    key: d.id,
    className: "text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
  }, d.name, " (₹", d.price, ")"))))), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOpenReservation(restaurant),
    className: "w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "📅"), /*#__PURE__*/React.createElement("span", null, "Book Table")), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleOpenRestaurant(restaurant),
    className: "w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "📖"), /*#__PURE__*/React.createElement("span", null, "Menu & Order")))))))), selectedRestaurant && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-48 bg-slate-900 flex-shrink-0"
  }, /*#__PURE__*/React.createElement("img", {
    src: selectedRestaurant.image_url,
    alt: selectedRestaurant.name,
    className: "w-full h-full object-cover opacity-60"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedRestaurant(null),
    className: "absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
  }, "✕"), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-4 left-6 text-white"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold px-2.5 py-1 bg-orange-500 rounded-full"
  }, selectedRestaurant.cuisine), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black mt-1"
  }, selectedRestaurant.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-200"
  }, selectedRestaurant.address, ", ", selectedRestaurant.city))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 flex-1 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-slate-900"
  }, "Restaurant Menu"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const r = selectedRestaurant;
      setSelectedRestaurant(null);
      handleOpenReservation(r);
    },
    className: "text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200"
  }, "Switch to Reserve Table →")), !selectedRestaurant.menu || selectedRestaurant.menu.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 py-6 text-center"
  }, "Menu items are currently being updated.") : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4"
  }, selectedRestaurant.menu.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-200 transition bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, item.image_url && /*#__PURE__*/React.createElement("img", {
    src: item.image_url,
    alt: item.name,
    className: "w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-slate-900"
  }, item.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 line-clamp-2 mt-0.5"
  }, item.description), item.dietary_tags && /*#__PURE__*/React.createElement("span", {
    className: "inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200"
  }, item.dietary_tags))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 pt-2 border-t border-slate-100 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-black text-slate-900"
  }, "₹", Number(item.price).toFixed(2)), /*#__PURE__*/React.createElement("button", {
    onClick: () => addToCart(item, selectedRestaurant),
    className: "bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "+"), /*#__PURE__*/React.createElement("span", null, "Add to Order"))))))))), reservingRestaurant && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white relative"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setReservingRestaurant(null),
    className: "absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
  }, "✕"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-orange-200"
  }, "Table Reservation"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black mt-1"
  }, reservingRestaurant.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-orange-100"
  }, reservingRestaurant.address)), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-4"
  }, resFeedback?.success ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black"
  }, "✓"), /*#__PURE__*/React.createElement("h3", {
    className: "mt-3 text-xl font-bold text-slate-900"
  }, "Reservation Confirmed!"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 mt-1"
  }, "Assigned ", /*#__PURE__*/React.createElement("strong", null, "Table #", resFeedback.data.table_number), " on", ' ', /*#__PURE__*/React.createElement("strong", null, resFeedback.data.reservation_date), " at", ' ', /*#__PURE__*/React.createElement("strong", null, resFeedback.data.time_slot), " for ", resFeedback.data.guests, " guests."), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-slate-800"
  }, "🔔 Simulated AWS SNS Confirmation Receipt:"), /*#__PURE__*/React.createElement("p", {
    className: "mt-0.5 text-slate-500"
  }, "Event: ", resFeedback.sns?.eventType), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500"
  }, "Booking ID: #", resFeedback.data.id)), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setReservingRestaurant(null);
      setShowReservationsModal(true);
    },
    className: "mt-6 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
  }, "View in My Bookings")) : /*#__PURE__*/React.createElement(React.Fragment, null, resFeedback?.error && /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "⚠️"), /*#__PURE__*/React.createElement("span", null, resFeedback.error)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Reservation Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: resDate,
    min: new Date().toISOString().split('T')[0],
    onChange: e => {
      setResDate(e.target.value);
      checkAvailability(reservingRestaurant.id, e.target.value, resGuests);
    },
    className: "w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Number of Guests"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, [1, 2, 4, 6, 8].map(num => /*#__PURE__*/React.createElement("button", {
    key: num,
    type: "button",
    onClick: () => {
      setResGuests(num);
      checkAvailability(reservingRestaurant.id, resDate, num);
    },
    className: `flex-1 py-2 text-xs font-bold rounded-xl border transition ${resGuests === num ? 'bg-orange-600 text-white border-orange-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`
  }, num, " ", num === 1 ? 'Guest' : 'Guests')))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Select Time Slot"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1"
  }, ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(slot => {
    const slotInfo = availabilitySlots.find(s => s.slot === slot);
    const isAvailable = slotInfo ? slotInfo.isAvailable : true;
    return /*#__PURE__*/React.createElement("button", {
      key: slot,
      type: "button",
      disabled: !isAvailable,
      onClick: () => setResSlot(slot),
      className: `py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center ${!isAvailable ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : resSlot === slot ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-600'}`
    }, /*#__PURE__*/React.createElement("span", null, slot), /*#__PURE__*/React.createElement("span", {
      className: "text-[9px] font-normal mt-0.5"
    }, isAvailable ? 'Available' : 'Booked'));
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Special Requests (Optional)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "e.g. Window table, anniversary celebration...",
    value: resSpecialRequests,
    onChange: e => setResSpecialRequests(e.target.value),
    className: "w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleConfirmReservation,
    disabled: resFeedback?.loading,
    className: "w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
  }, resFeedback?.loading ? /*#__PURE__*/React.createElement("span", {
    className: "animate-spin text-base"
  }, "⏳") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "🔒"), /*#__PURE__*/React.createElement("span", null, "Lock Table & Confirm"))))))), showCartDrawer && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
    onClick: () => setShowCartDrawer(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-y-0 right-0 max-w-full flex pl-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-6 bg-slate-900 text-white flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black"
  }, "Your Order Cart"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, cart.length > 0 ? `Ordering from ${cart[0].restaurant_name}` : 'Cart is currently empty')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowCartDrawer(false),
    className: "text-white hover:text-orange-400 text-lg"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "p-6 flex-1 overflow-y-auto space-y-4"
  }, cart.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20 text-slate-400"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-5xl"
  }, "🛍️"), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-sm font-bold text-slate-600"
  }, "Your cart is empty"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1"
  }, "Add items from any restaurant menu to start an order.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, cart.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "flex items-center justify-between border-b border-slate-100 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-slate-900"
  }, item.name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "₹", Number(item.price).toFixed(2), " each")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => updateCartQty(item.id, -1),
    className: "w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
  }, "-"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold w-4 text-center"
  }, item.quantity), /*#__PURE__*/React.createElement("button", {
    onClick: () => updateCartQty(item.id, 1),
    className: "w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
  }, "+"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-slate-900 w-16 text-right"
  }, "₹", (item.price * item.quantity).toFixed(2)))))), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 pt-4 border-t border-slate-200 space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Dining Option"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-2"
  }, ['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map(type => /*#__PURE__*/React.createElement("button", {
    key: type,
    type: "button",
    onClick: () => setOrderType(type),
    className: `py-2 text-[11px] font-bold rounded-lg border transition ${orderType === type ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`
  }, type.replace('_', ' '))))), orderType === 'DINE_IN' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Table Number"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "20",
    value: tableNumber,
    onChange: e => setTableNumber(parseInt(e.target.value) || 1),
    className: "w-full text-xs p-2 rounded-lg border border-slate-300 font-bold"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Special Notes for Kitchen"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "e.g. Extra napkins, no cilantro...",
    value: specialNotes,
    onChange: e => setSpecialNotes(e.target.value),
    className: "w-full text-xs p-2 rounded-lg border border-slate-300"
  }))))), cart.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "p-6 bg-slate-50 border-t border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-slate-600"
  }, "Total Amount"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-slate-900"
  }, "₹", cartTotal.toFixed(2))), /*#__PURE__*/React.createElement("button", {
    onClick: handleProceedToPayment,
    className: "w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "💳"), /*#__PURE__*/React.createElement("span", null, "Checkout & Pay (₹", cartTotal.toFixed(2), ")")))))), showPaymentModal && paymentData && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-slate-900"
  }, "💳 Payment Simulation"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowPaymentModal(false),
    className: "text-slate-400 hover:text-slate-600"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-orange-700 font-bold"
  }, "Total Amount Due"), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-black text-orange-900"
  }, "₹", Number(paymentData.amount).toFixed(2))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-4"
  }, "Select one of the mock test cards below to simulate instant payment gateway authorization:"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      const res = await handleProcessPayment('4242424242424242');
      if (res.success) {
        alert(`✅ Payment authorized! Transaction ID: ${res.payment.transaction_id}. Order placed successfully.`);
        setShowPaymentModal(false);
        setShowOrdersModal(true);
      } else {
        alert('❌ Payment failed: ' + res.error);
      }
    },
    className: "w-full p-3.5 bg-green-50 hover:bg-green-100 border border-green-300 rounded-xl text-left transition flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-green-900"
  }, "Test Card: VISA (Approved)"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-green-700 font-mono"
  }, "•••• •••• •••• 4242")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-green-600 text-white font-bold px-2.5 py-1 rounded-full"
  }, "Simulate Success")), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      const res = await handleProcessPayment('4000000000000000');
      alert(`❌ Payment declined as expected! Reason: ${res.error}`);
    },
    className: "w-full p-3.5 bg-red-50 hover:bg-red-100 border border-red-300 rounded-xl text-left transition flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-red-900"
  }, "Test Card: DECLINE (Declined)"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-red-700 font-mono"
  }, "•••• •••• •••• 0000")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-full"
  }, "Simulate Decline"))))), showReservationsModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center pb-4 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-black text-slate-900"
  }, "📅 My Table Reservations"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowReservationsModal(false),
    className: "text-slate-400 hover:text-slate-600"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto py-4 space-y-3"
  }, userReservations.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-sm text-slate-500 py-10"
  }, "You have no active reservations yet.") : userReservations.map(res => /*#__PURE__*/React.createElement("div", {
    key: res.id,
    className: "p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-slate-900"
  }, res.restaurant_name), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-black px-2 py-0.5 rounded-full ${res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`
  }, res.status)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "Date: ", /*#__PURE__*/React.createElement("strong", null, res.reservation_date), " at ", /*#__PURE__*/React.createElement("strong", null, res.time_slot), " • ", res.guests, " Guests", res.table_number && ` • Table #${res.table_number}`), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-400 font-mono"
  }, "ID: ", res.id)), res.status !== 'CANCELLED' && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleCancelReservation(res.id),
    className: "text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition"
  }, "Cancel Booking")))))), showOrdersModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center pb-4 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-black text-slate-900"
  }, "🧾 My Orders & Tracking"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowOrdersModal(false),
    className: "text-slate-400 hover:text-slate-600"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto py-4 space-y-4"
  }, userOrders.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-center text-sm text-slate-500 py-10"
  }, "No orders placed yet.") : userOrders.map(order => /*#__PURE__*/React.createElement("div", {
    key: order.id,
    className: "p-4 border border-slate-200 rounded-2xl bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-slate-900"
  }, order.restaurant_name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "Order #", order.id, " • ", new Date(order.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-black text-slate-900"
  }, "₹", Number(order.total_amount).toFixed(2)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: `inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${order.status === 'READY' ? 'bg-green-100 text-green-800' : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' : order.status === 'SERVED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`
  }, "Status: ", order.status)))), order.items && order.items.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-2"
  }, order.items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i.id,
    className: "text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700"
  }, i.quantity, "x ", i.name)))))))), showAdminModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center pb-4 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-amber-600 uppercase tracking-wider"
  }, "Management Control"), /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-black text-slate-900"
  }, "⚡ TABLESERVE Admin Panel")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAdminModal(false),
    className: "text-slate-400 hover:text-slate-600"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "flex border-b border-slate-200 mt-3 gap-2"
  }, ['RESTAURANTS', 'KITCHEN_ORDERS', 'MICROSERVICES'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setAdminTab(t),
    className: `text-xs font-bold py-2 px-4 border-b-2 transition ${adminTab === t ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`
  }, t.replace('_', ' ')))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto py-4"
  }, adminTab === 'KITCHEN_ORDERS' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-slate-800 mb-2"
  }, "Live Kitchen Order Queue"), userOrders.map(order => /*#__PURE__*/React.createElement("div", {
    key: order.id,
    className: "p-3 border border-slate-200 rounded-xl flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold"
  }, "#", order.id, " - ", order.restaurant_name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "Current Status: ", /*#__PURE__*/React.createElement("strong", null, order.status))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, ['PLACED', 'PREPARING', 'READY', 'SERVED'].map(st => /*#__PURE__*/React.createElement("button", {
    key: st,
    onClick: () => handleAdvanceOrderStatus(order.id, st),
    className: `text-[10px] font-bold px-2.5 py-1 rounded-lg border ${order.status === st ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'}`
  }, st)))))), adminTab === 'MICROSERVICES' && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, [{
    name: 'Restaurant Service',
    port: 5001,
    status: 'Healthy',
    role: 'Catalog & Tables'
  }, {
    name: 'Reservation & Payment',
    port: 5002,
    status: 'Healthy',
    role: 'Locks & SNS'
  }, {
    name: 'Ordering Service',
    port: 5003,
    status: 'Healthy',
    role: 'Pricing & Lifecycle'
  }, {
    name: 'Search Service',
    port: 5004,
    status: 'Healthy',
    role: 'Full-text & Filter'
  }, {
    name: 'API Gateway Hub',
    port: 5000,
    status: 'Healthy',
    role: 'Reverse Proxy & Swagger'
  }, {
    name: 'Amazon Lex Concierge',
    port: 5000,
    status: 'Online',
    role: '8 Intents Runtime'
  }].map(srv => /*#__PURE__*/React.createElement("div", {
    key: srv.name,
    className: "p-4 border border-slate-200 rounded-2xl bg-slate-50/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold text-slate-900"
  }, srv.name), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full"
  }, srv.status)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "Port: ", srv.port, " • ", srv.role)))), adminTab === 'RESTAURANTS' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mb-3"
  }, "Manage registered restaurants across the platform."), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, restaurants.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    className: "p-3 border border-slate-200 rounded-xl flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-900"
  }, r.name), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500"
  }, r.cuisine, " • ", r.city, " • Rating: ", r.rating, "★")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-400 font-mono"
  }, "ID: ", r.id)))))))), showAuthModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-black text-slate-900"
  }, authMode === 'LOGIN' ? 'Welcome Back' : 'Create New Account'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAuthModal(false),
    className: "text-slate-400 hover:text-slate-600"
  }, "✕")), authError && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl"
  }, authError), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAuthSubmit,
    className: "space-y-3"
  }, authMode === 'REGISTER' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: authForm.name,
    onChange: e => setAuthForm({
      ...authForm,
      name: e.target.value
    }),
    className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Role"), /*#__PURE__*/React.createElement("select", {
    value: authForm.role,
    onChange: e => setAuthForm({
      ...authForm,
      role: e.target.value
    }),
    className: "w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
  }, /*#__PURE__*/React.createElement("option", {
    value: "CUSTOMER"
  }, "Customer"), /*#__PURE__*/React.createElement("option", {
    value: "ADMIN"
  }, "Platform Admin")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: authForm.email,
    onChange: e => setAuthForm({
      ...authForm,
      email: e.target.value
    }),
    className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-slate-700 mb-1"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: authForm.password,
    onChange: e => setAuthForm({
      ...authForm,
      password: e.target.value
    }),
    className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition mt-2"
  }, authMode === 'LOGIN' ? 'Sign In' : 'Create Account')), /*#__PURE__*/React.createElement("div", {
    className: "mt-6 pt-4 border-t border-slate-200 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2"
  }, "1-Click Demo Accounts (For Presentation)"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleQuickLogin('CUSTOMER'),
    className: "py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
  }, "👤 Customer (Aarav)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => handleQuickLogin('ADMIN'),
    className: "py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition"
  }, "⚡ Admin (Supervisor)")), /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
      setAuthError('');
    },
    className: "text-xs text-orange-600 font-bold hover:underline"
  }, authMode === 'LOGIN' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'))))), /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-6 right-6 z-50"
  }, !showChatbot ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowChatbot(true),
    className: "w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/30 hover:scale-105 transition duration-200 group",
    title: "Chat with TABLESERVE Amazon Lex Bot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-2xl group-hover:rotate-12 transition"
  }, "🤖"), /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 flex h-3 w-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
  }), /*#__PURE__*/React.createElement("span", {
    className: "relative inline-flex rounded-full h-3 w-3 bg-green-500"
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "w-[360px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-4 text-white flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-lg shadow-sm"
  }, "🤖"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-extrabold flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", null, "TABLESERVE Assistant"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] bg-orange-500/30 text-orange-300 font-mono px-1.5 py-0.2 rounded border border-orange-500/40"
  }, "Amazon Lex")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-300"
  }, "8 Intents NLP Concierge"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowChatbot(false),
    className: "text-slate-400 hover:text-white text-lg p-1"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70"
  }, chatMessages.map((msg, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: `flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-orange-600 text-white rounded-br-none shadow-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`
  }, /*#__PURE__*/React.createElement("p", {
    className: "whitespace-pre-line"
  }, msg.text), msg.intent && msg.sender === 'bot' && /*#__PURE__*/React.createElement("span", {
    className: "block mt-1 text-[9px] text-slate-400 font-mono"
  }, "Intent: ", msg.intent)), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] text-slate-400 mt-0.5 px-1"
  }, msg.time))), chatLoading && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 p-3 bg-white border border-slate-200 rounded-2xl max-w-[80px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce",
    style: {
      animationDelay: '0.2s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce",
    style: {
      animationDelay: '0.4s'
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: chatEndRef
  })), /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendChatMessage('Find Biryani in Hyderabad'),
    className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
  }, "🍛 Find Biryani"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendChatMessage('Show menu for Bukhara'),
    className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
  }, "📖 Bukhara Menu"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendChatMessage('Check my reservation status'),
    className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
  }, "📅 My Status"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendChatMessage('help'),
    className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition"
  }, "❓ Help")), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-white border-t border-slate-200 flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Ask about restaurants, menus, reservations...",
    value: chatInput,
    onChange: e => setChatInput(e.target.value),
    onKeyDown: e => e.key === 'Enter' && handleSendChatMessage(),
    className: "flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSendChatMessage(),
    disabled: chatLoading,
    className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
  }, "Send")))), /*#__PURE__*/React.createElement("footer", {
    className: "bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-slate-200 text-sm"
  }, "TABLESERVE • Enterprise Restaurant Reservation and Ordering Platform"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500"
  }, "Microservices: Restaurant (5001) | Reservation & Payment (5002) | Ordering (5003) | Search (5004) | Gateway (5000)"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600"
  }, "Powered by React, Express, PostgreSQL, Docker, AWS Architecture & Amazon Lex"))));
}

// Render into root element
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));