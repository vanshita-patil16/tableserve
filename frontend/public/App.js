import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
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
  const [adminTab, setAdminTab] = useState('RESTAURANTS'); // RESTAURANTS, KITCHEN_ORDERS, MICROSERVICES, CLOUDWATCH_METRICS
  const [cloudwatchData, setCloudwatchData] = useState(null);
  const [loadingCloudwatch, setLoadingCloudwatch] = useState(false);
  const [testAlarmTriggered, setTestAlarmTriggered] = useState(false);

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

  // Amazon Lex Chatbot State & Audio Capabilities
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([{
    sender: 'bot',
    text: "👋 Namaste! I'm your TABLESERVE dining assistant powered by Amazon Lex v2 with voice audio. How can I help you today?",
    intent: 'GreetingIntent',
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(true);
  const [showDialogueTraining, setShowDialogueTraining] = useState(false);
  const [chatSessionAttributes, setChatSessionAttributes] = useState({});
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

  // CloudWatch Metrics Fetcher & Telemetry Handlers
  const fetchCloudWatchMetrics = async () => {
    setLoadingCloudwatch(true);
    try {
      const res = await fetch('/api/cloudwatch/metrics');
      const data = await res.json();
      if (data.success) {
        setCloudwatchData(data);
      }
    } catch (err) {
      console.error('Failed to load CloudWatch metrics', err);
    } finally {
      setLoadingCloudwatch(false);
    }
  };
  const handleSimulateTraffic = async () => {
    try {
      await fetch('/api/cloudwatch/simulate-traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: 35
        })
      });
      fetchCloudWatchMetrics();
    } catch (err) {
      console.error(err);
    }
  };
  const handleToggleAlarm = async trigger => {
    try {
      await fetch('/api/cloudwatch/test-alarm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alarmIndex: 1,
          trigger
        })
      });
      setTestAlarmTriggered(trigger);
      fetchCloudWatchMetrics();
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (showAdminModal) {
      fetchCloudWatchMetrics();
    }
  }, [showAdminModal, adminTab]);

  // Text-to-Speech (Voice Output) using Web Speech API / Amazon Polly Voice Simulation
  const speakBotMessage = text => {
    if (!voiceAudioEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\*\*/g, '').replace(/•/g, '').replace(/[#*_~`]/g, '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Speech-to-Text (Voice Input via Microphone)
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is supported in Google Chrome, Microsoft Edge, and modern browsers. Please use Chrome to enable microphone access!');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          setChatInput(transcript);
          handleSendChatMessage(transcript);
        }
      };
      recognition.onerror = event => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initialization error:', err);
      setIsListening(false);
    }
  };

  // Send message to Amazon Lex Chatbot with Multi-Turn Context & Audio
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
          message: textToSend,
          sessionAttributes: chatSessionAttributes
        })
      });
      const data = await res.json();
      if (data.sessionAttributes) {
        setChatSessionAttributes(data.sessionAttributes);
      }
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

      // Speak reply if voice audio enabled
      if (voiceAudioEnabled && data.reply) {
        speakBotMessage(data.reply);
      }
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
  return /*#__PURE__*/_jsxDEV("div", {
    className: "flex flex-col min-h-screen",
    children: [/*#__PURE__*/_jsxDEV("header", {
      className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center space-x-3 cursor-pointer",
          onClick: () => {
            setActiveCuisine('All');
            setSearchQuery('');
          },
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xl",
            children: "🍽️"
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent",
              children: "TABLESERVE"
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              className: "hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200",
              children: "Microservices Platform"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center space-x-3 sm:space-x-5",
          children: [token && /*#__PURE__*/_jsxDEV(_Fragment, {
            children: [/*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowReservationsModal(true),
              className: "hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "📅"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: "My Bookings"
              }, void 0, false), userReservations.length > 0 && /*#__PURE__*/_jsxDEV("span", {
                className: "ml-1 text-xs px-1.5 py-0.2 bg-orange-500 text-white rounded-full font-bold",
                children: userReservations.length
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowOrdersModal(true),
              className: "hidden md:flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "🧾"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: "Orders"
              }, void 0, false), userOrders.length > 0 && /*#__PURE__*/_jsxDEV("span", {
                className: "ml-1 text-xs px-1.5 py-0.2 bg-slate-800 text-white rounded-full font-bold",
                children: userOrders.length
              }, void 0, false)]
            }, void 0, true), user?.role === 'ADMIN' && /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowAdminModal(true),
              className: "flex items-center space-x-1 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg transition",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "⚡"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: "Admin Panel"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowCartDrawer(true),
            className: "relative p-2 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition",
            title: "Shopping Cart",
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "text-xl",
              children: "🛍️"
            }, void 0, false), cart.length > 0 && /*#__PURE__*/_jsxDEV("span", {
              className: "absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white animate-bounce",
              children: cart.reduce((sum, i) => sum + i.quantity, 0)
            }, void 0, false)]
          }, void 0, true), user ? /*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center space-x-2 pl-2 border-l border-slate-200",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase",
              children: user.name.charAt(0)
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "hidden sm:block text-left text-xs",
              children: [/*#__PURE__*/_jsxDEV("p", {
                className: "font-bold text-slate-800 truncate max-w-[120px]",
                children: user.name
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-slate-500 font-medium capitalize",
                children: user.role.toLowerCase()
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: handleLogout,
              className: "text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition",
              title: "Log out",
              children: "Sign Out"
            }, void 0, false)]
          }, void 0, true) : /*#__PURE__*/_jsxDEV("button", {
            onClick: () => {
              setAuthMode('LOGIN');
              setShowAuthModal(true);
            },
            className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:shadow transition",
            children: "Sign In"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("section", {
      className: "relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-slate-50 border-b border-orange-100/50 py-12 md:py-16",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-4 tracking-wide uppercase",
          children: /*#__PURE__*/_jsxDEV("span", {
            children: "✨ Seamless Dining & Cloud-Ready Microservices"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV("h1", {
          className: "text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight",
          children: ["Reserve Tables. ", /*#__PURE__*/_jsxDEV("span", {
            className: "bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent",
            children: "Order Gourmet."
          }, void 0, false), /*#__PURE__*/_jsxDEV("br", {}, void 0, false), "Dine Effortlessly."]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          className: "mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto",
          children: "Experience real-time table booking with strict double-booking prevention, simulated payments, live order tracking, and Amazon Lex conversational AI."
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "mt-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-orange-900/5 border border-slate-200 flex flex-col sm:flex-row gap-2",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex-1 flex items-center px-3 space-x-2",
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "text-slate-400",
              children: "🔍"
            }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
              type: "text",
              placeholder: "Search restaurants, cuisines (Biryani, North Indian, Seafood), dishes (Dal Bukhara, Dosa), or cities (Delhi, Mumbai, Bengaluru)...",
              value: searchQuery,
              onChange: e => setSearchQuery(e.target.value),
              className: "w-full text-sm font-medium focus:outline-none bg-transparent"
            }, void 0, false), searchQuery && /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setSearchQuery(''),
              className: "text-xs text-slate-400 hover:text-slate-600",
              children: "✕"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: fetchRestaurants,
            className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md shadow-orange-600/20",
            children: "Search"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "mt-6 flex flex-wrap justify-center gap-2",
          children: cuisinesList.map(c => /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setActiveCuisine(c),
            className: `text-xs font-bold px-4 py-2 rounded-xl transition ${activeCuisine === c ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-200'}`,
            children: c === 'All' ? '🌟 All Cuisines' : c
          }, c, false))
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("section", {
      className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex flex-wrap items-center gap-3",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "text-xs font-bold text-slate-400 uppercase tracking-wider",
            children: "Filters:"
          }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
            value: cityFilter,
            onChange: e => setCityFilter(e.target.value),
            className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500",
            children: citiesList.map(city => /*#__PURE__*/_jsxDEV("option", {
              value: city === 'All Cities' ? '' : city,
              children: ["📍 ", city]
            }, city, true))
          }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
            value: dietaryFilter,
            onChange: e => setDietaryFilter(e.target.value),
            className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500",
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "",
              children: "🌱 All Dietary Options"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Pure Veg",
              children: "Pure Veg"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Vegetarian",
              children: "Vegetarian"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Jain",
              children: "Jain Friendly"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Halal",
              children: "Halal Certified"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Gluten-Free",
              children: "Gluten-Free"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "Vegan",
              children: "Vegan"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("select", {
            value: priceFilter,
            onChange: e => setPriceFilter(e.target.value),
            className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500",
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "",
              children: "₹ Any Price Tier"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "₹",
              children: "₹ (Budget / Street Food)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "₹₹",
              children: "₹₹ (Casual & Mid-Range)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "₹₹₹",
              children: "₹₹₹ (Premium & Signature)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "₹₹₹₹",
              children: "₹₹₹₹ (Luxury & Fine Dining)"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("select", {
            value: minRatingFilter,
            onChange: e => setMinRatingFilter(e.target.value),
            className: "text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-orange-500",
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "",
              children: "⭐ Any Rating"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "4.5",
              children: "4.5+ Stars"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "4.7",
              children: "4.7+ Stars"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "4.9",
              children: "4.9+ Top Rated"
            }, void 0, false)]
          }, void 0, true), (cityFilter || dietaryFilter || priceFilter || minRatingFilter || searchQuery || activeCuisine !== 'All') && /*#__PURE__*/_jsxDEV("button", {
            onClick: () => {
              setCityFilter('');
              setDietaryFilter('');
              setPriceFilter('');
              setMinRatingFilter('');
              setSearchQuery('');
              setActiveCuisine('All');
            },
            className: "text-xs text-orange-600 hover:text-orange-700 font-bold px-2 py-1 rounded hover:bg-orange-50",
            children: "Reset Filters"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "text-xs font-bold text-slate-500",
          children: ["Showing ", /*#__PURE__*/_jsxDEV("span", {
            className: "text-orange-600",
            children: restaurants.length
          }, void 0, false), " restaurant", restaurants.length !== 1 ? 's' : '']
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("main", {
      className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full",
      children: loading ? /*#__PURE__*/_jsxDEV("div", {
        className: "text-center py-24",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-slate-500 font-semibold",
          children: "Loading top restaurants..."
        }, void 0, false)]
      }, void 0, true) : restaurants.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
        className: "text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8",
        children: [/*#__PURE__*/_jsxDEV("span", {
          className: "text-5xl",
          children: "🍽️"
        }, void 0, false), /*#__PURE__*/_jsxDEV("h3", {
          className: "mt-4 text-lg font-bold text-slate-800",
          children: "No restaurants match your filters"
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "mt-1 text-sm text-slate-500",
          children: "Try broadening your search or resetting dietary/price filters."
        }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
          onClick: () => {
            setDietaryFilter('');
            setPriceFilter('');
            setMinRatingFilter('');
            setSearchQuery('');
            setActiveCuisine('All');
          },
          className: "mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow hover:bg-orange-700",
          children: "Clear All Filters"
        }, void 0, false)]
      }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: restaurants.map(restaurant => /*#__PURE__*/_jsxDEV("div", {
          className: "bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "relative h-48 overflow-hidden bg-slate-100",
            children: [/*#__PURE__*/_jsxDEV("img", {
              src: restaurant.image_url,
              alt: restaurant.name,
              className: "w-full h-full object-cover group-hover:scale-105 transition duration-500",
              loading: "lazy"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "absolute top-3 left-3 flex gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "bg-white/90 backdrop-blur-md text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm",
                children: restaurant.cuisine
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full",
                children: restaurant.price_tier
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "absolute top-3 right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "★"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: restaurant.rating
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "p-5 flex-1 flex flex-col justify-between",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("h3", {
                className: "text-xl font-bold text-slate-900 group-hover:text-orange-600 transition",
                children: restaurant.name
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "mt-1.5 text-xs text-slate-500 line-clamp-2",
                children: restaurant.description
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "mt-4 space-y-1 text-xs text-slate-500",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  className: "flex items-center gap-1.5",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: "📍"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "truncate",
                    children: [restaurant.address, ", ", restaurant.city]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex items-center gap-1.5",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: "🕒"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    children: [restaurant.opening_time, " - ", restaurant.closing_time, " • ", restaurant.total_tables || 10, " Tables"]
                  }, void 0, true)]
                }, void 0, true)]
              }, void 0, true), restaurant.featuredDishes && restaurant.featuredDishes.length > 0 && /*#__PURE__*/_jsxDEV("div", {
                className: "mt-3 pt-3 border-t border-slate-100",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider",
                  children: "Popular Items:"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "mt-1 flex flex-wrap gap-1.5",
                  children: restaurant.featuredDishes.map(d => /*#__PURE__*/_jsxDEV("span", {
                    className: "text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md",
                    children: [d.name, " (₹", d.price, ")"]
                  }, d.id, true))
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2",
              children: [/*#__PURE__*/_jsxDEV("button", {
                onClick: () => handleOpenReservation(restaurant),
                className: "w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-1.5",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  children: "📅"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  children: "Book Table"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
                onClick: () => handleOpenRestaurant(restaurant),
                className: "w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  children: "📖"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  children: "Menu & Order"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true)]
        }, restaurant.id, true))
      }, void 0, false)
    }, void 0, false), selectedRestaurant && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "relative h-48 bg-slate-900 flex-shrink-0",
          children: [/*#__PURE__*/_jsxDEV("img", {
            src: selectedRestaurant.image_url,
            alt: selectedRestaurant.name,
            className: "w-full h-full object-cover opacity-60"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setSelectedRestaurant(null),
            className: "absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition",
            children: "✕"
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "absolute bottom-4 left-6 text-white",
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "text-xs font-bold px-2.5 py-1 bg-orange-500 rounded-full",
              children: selectedRestaurant.cuisine
            }, void 0, false), /*#__PURE__*/_jsxDEV("h2", {
              className: "text-2xl font-black mt-1",
              children: selectedRestaurant.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-slate-200",
              children: [selectedRestaurant.address, ", ", selectedRestaurant.city]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-6 flex-1 overflow-y-auto",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center justify-between mb-4",
            children: [/*#__PURE__*/_jsxDEV("h3", {
              className: "text-lg font-bold text-slate-900",
              children: "Restaurant Menu"
            }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => {
                const r = selectedRestaurant;
                setSelectedRestaurant(null);
                handleOpenReservation(r);
              },
              className: "text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200",
              children: "Switch to Reserve Table →"
            }, void 0, false)]
          }, void 0, true), !selectedRestaurant.menu || selectedRestaurant.menu.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
            className: "text-sm text-slate-500 py-6 text-center",
            children: "Menu items are currently being updated."
          }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
            children: selectedRestaurant.menu.map(item => /*#__PURE__*/_jsxDEV("div", {
              className: "border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-200 transition bg-slate-50/50",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-3",
                children: [item.image_url && /*#__PURE__*/_jsxDEV("img", {
                  src: item.image_url,
                  alt: item.name,
                  className: "w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex-1",
                  children: [/*#__PURE__*/_jsxDEV("h4", {
                    className: "text-sm font-bold text-slate-900",
                    children: item.name
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-slate-500 line-clamp-2 mt-0.5",
                    children: item.description
                  }, void 0, false), item.dietary_tags && /*#__PURE__*/_jsxDEV("span", {
                    className: "inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200",
                    children: item.dietary_tags
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "mt-3 pt-2 border-t border-slate-100 flex items-center justify-between",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-sm font-black text-slate-900",
                  children: ["₹", Number(item.price).toFixed(2)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => addToCart(item, selectedRestaurant),
                  className: "bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: "+"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    children: "Add to Order"
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true)]
            }, item.id, true))
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), reservingRestaurant && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up flex flex-col",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white relative",
          children: [/*#__PURE__*/_jsxDEV("button", {
            onClick: () => setReservingRestaurant(null),
            className: "absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            children: "✕"
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            className: "text-xs font-bold uppercase tracking-wider text-orange-200",
            children: "Table Reservation"
          }, void 0, false), /*#__PURE__*/_jsxDEV("h2", {
            className: "text-2xl font-black mt-1",
            children: reservingRestaurant.name
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-xs text-orange-100",
            children: reservingRestaurant.address
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-6 space-y-4",
          children: resFeedback?.success ? /*#__PURE__*/_jsxDEV("div", {
            className: "text-center py-6",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black",
              children: "✓"
            }, void 0, false), /*#__PURE__*/_jsxDEV("h3", {
              className: "mt-3 text-xl font-bold text-slate-900",
              children: "Reservation Confirmed!"
            }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-slate-600 mt-1",
              children: ["Assigned ", /*#__PURE__*/_jsxDEV("strong", {
                children: ["Table #", resFeedback.data.table_number]
              }, void 0, true), " on", ' ', /*#__PURE__*/_jsxDEV("strong", {
                children: resFeedback.data.reservation_date
              }, void 0, false), " at", ' ', /*#__PURE__*/_jsxDEV("strong", {
                children: resFeedback.data.time_slot
              }, void 0, false), " for ", resFeedback.data.guests, " guests."]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600",
              children: [/*#__PURE__*/_jsxDEV("p", {
                className: "font-bold text-slate-800",
                children: "🔔 Simulated AWS SNS Confirmation Receipt:"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "mt-0.5 text-slate-500",
                children: ["Event: ", resFeedback.sns?.eventType]
              }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                className: "text-slate-500",
                children: ["Booking ID: #", resFeedback.data.id]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => {
                setReservingRestaurant(null);
                setShowReservationsModal(true);
              },
              className: "mt-6 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition",
              children: "View in My Bookings"
            }, void 0, false)]
          }, void 0, true) : /*#__PURE__*/_jsxDEV(_Fragment, {
            children: [resFeedback?.error && /*#__PURE__*/_jsxDEV("div", {
              className: "p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "⚠️"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: resFeedback.error
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Reservation Date"
              }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                type: "date",
                value: resDate,
                min: new Date().toISOString().split('T')[0],
                onChange: e => {
                  setResDate(e.target.value);
                  checkAvailability(reservingRestaurant.id, e.target.value, resGuests);
                },
                className: "w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Number of Guests"
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-2",
                children: [1, 2, 4, 6, 8].map(num => /*#__PURE__*/_jsxDEV("button", {
                  type: "button",
                  onClick: () => {
                    setResGuests(num);
                    checkAvailability(reservingRestaurant.id, resDate, num);
                  },
                  className: `flex-1 py-2 text-xs font-bold rounded-xl border transition ${resGuests === num ? 'bg-orange-600 text-white border-orange-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`,
                  children: [num, " ", num === 1 ? 'Guest' : 'Guests']
                }, num, true))
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Select Time Slot"
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1",
                children: ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(slot => {
                  const slotInfo = availabilitySlots.find(s => s.slot === slot);
                  const isAvailable = slotInfo ? slotInfo.isAvailable : true;
                  return /*#__PURE__*/_jsxDEV("button", {
                    type: "button",
                    disabled: !isAvailable,
                    onClick: () => setResSlot(slot),
                    className: `py-2 px-1 text-xs font-bold rounded-xl border transition flex flex-col items-center ${!isAvailable ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : resSlot === slot ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-600'}`,
                    children: [/*#__PURE__*/_jsxDEV("span", {
                      children: slot
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-[9px] font-normal mt-0.5",
                      children: isAvailable ? 'Available' : 'Booked'
                    }, void 0, false)]
                  }, slot, true);
                })
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Special Requests (Optional)"
              }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                type: "text",
                placeholder: "e.g. Window table, anniversary celebration...",
                value: resSpecialRequests,
                onChange: e => setResSpecialRequests(e.target.value),
                className: "w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: handleConfirmReservation,
              disabled: resFeedback?.loading,
              className: "w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2",
              children: resFeedback?.loading ? /*#__PURE__*/_jsxDEV("span", {
                className: "animate-spin text-base",
                children: "⏳"
              }, void 0, false) : /*#__PURE__*/_jsxDEV(_Fragment, {
                children: [/*#__PURE__*/_jsxDEV("span", {
                  children: "🔒"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  children: "Lock Table & Confirm"
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), showCartDrawer && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 overflow-hidden",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "absolute inset-0 bg-black/50 backdrop-blur-sm",
        onClick: () => setShowCartDrawer(false)
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        className: "fixed inset-y-0 right-0 max-w-full flex pl-10",
        children: /*#__PURE__*/_jsxDEV("div", {
          className: "w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-up",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "p-6 bg-slate-900 text-white flex items-center justify-between",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("h3", {
                className: "text-lg font-black",
                children: "Your Order Cart"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-slate-400",
                children: cart.length > 0 ? `Ordering from ${cart[0].restaurant_name}` : 'Cart is currently empty'
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowCartDrawer(false),
              className: "text-white hover:text-orange-400 text-lg",
              children: "✕"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "p-6 flex-1 overflow-y-auto space-y-4",
            children: cart.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
              className: "text-center py-20 text-slate-400",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-5xl",
                children: "🛍️"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "mt-3 text-sm font-bold text-slate-600",
                children: "Your cart is empty"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-slate-400 mt-1",
                children: "Add items from any restaurant menu to start an order."
              }, void 0, false)]
            }, void 0, true) : /*#__PURE__*/_jsxDEV(_Fragment, {
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "space-y-3",
                children: cart.map(item => /*#__PURE__*/_jsxDEV("div", {
                  className: "flex items-center justify-between border-b border-slate-100 pb-3",
                  children: [/*#__PURE__*/_jsxDEV("div", {
                    className: "flex-1",
                    children: [/*#__PURE__*/_jsxDEV("h4", {
                      className: "text-xs font-bold text-slate-900",
                      children: item.name
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xs text-slate-500",
                      children: ["₹", Number(item.price).toFixed(2), " each"]
                    }, void 0, true)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center space-x-2",
                    children: [/*#__PURE__*/_jsxDEV("button", {
                      onClick: () => updateCartQty(item.id, -1),
                      className: "w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200",
                      children: "-"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xs font-bold w-4 text-center",
                      children: item.quantity
                    }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => updateCartQty(item.id, 1),
                      className: "w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200",
                      children: "+"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xs font-black text-slate-900 w-16 text-right",
                      children: ["₹", (item.price * item.quantity).toFixed(2)]
                    }, void 0, true)]
                  }, void 0, true)]
                }, item.id, true))
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "mt-6 pt-4 border-t border-slate-200 space-y-3",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "block text-xs font-bold text-slate-700 mb-1",
                    children: "Dining Option"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                    className: "grid grid-cols-3 gap-2",
                    children: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map(type => /*#__PURE__*/_jsxDEV("button", {
                      type: "button",
                      onClick: () => setOrderType(type),
                      className: `py-2 text-[11px] font-bold rounded-lg border transition ${orderType === type ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`,
                      children: type.replace('_', ' ')
                    }, type, false))
                  }, void 0, false)]
                }, void 0, true), orderType === 'DINE_IN' && /*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "block text-xs font-bold text-slate-700 mb-1",
                    children: "Table Number"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                    type: "number",
                    min: "1",
                    max: "20",
                    value: tableNumber,
                    onChange: e => setTableNumber(parseInt(e.target.value) || 1),
                    className: "w-full text-xs p-2 rounded-lg border border-slate-300 font-bold"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("label", {
                    className: "block text-xs font-bold text-slate-700 mb-1",
                    children: "Special Notes for Kitchen"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                    type: "text",
                    placeholder: "e.g. Extra napkins, no cilantro...",
                    value: specialNotes,
                    onChange: e => setSpecialNotes(e.target.value),
                    className: "w-full text-xs p-2 rounded-lg border border-slate-300"
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true)]
            }, void 0, true)
          }, void 0, false), cart.length > 0 && /*#__PURE__*/_jsxDEV("div", {
            className: "p-6 bg-slate-50 border-t border-slate-200",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between items-center mb-4",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-sm font-bold text-slate-600",
                children: "Total Amount"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "text-xl font-black text-slate-900",
                children: ["₹", cartTotal.toFixed(2)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: handleProceedToPayment,
              className: "w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 transition flex items-center justify-center gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "💳"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: ["Checkout & Pay (₹", cartTotal.toFixed(2), ")"]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true)
      }, void 0, false)]
    }, void 0, true), showPaymentModal && paymentData && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex justify-between items-center mb-4",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-black text-slate-900",
            children: "💳 Payment Simulation"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowPaymentModal(false),
            className: "text-slate-400 hover:text-slate-600",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-4",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "text-xs text-orange-700 font-bold",
            children: "Total Amount Due"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-2xl font-black text-orange-900",
            children: ["₹", Number(paymentData.amount).toFixed(2)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          className: "text-xs text-slate-500 mb-4",
          children: "Select one of the mock test cards below to simulate instant payment gateway authorization:"
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-3",
          children: [/*#__PURE__*/_jsxDEV("button", {
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
            className: "w-full p-3.5 bg-green-50 hover:bg-green-100 border border-green-300 rounded-xl text-left transition flex items-center justify-between",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-xs font-black text-green-900",
                children: "Test Card: VISA (Approved)"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-[11px] text-green-700 font-mono",
                children: "•••• •••• •••• 4242"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
              className: "text-xs bg-green-600 text-white font-bold px-2.5 py-1 rounded-full",
              children: "Simulate Success"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: async () => {
              const res = await handleProcessPayment('4000000000000000');
              alert(`❌ Payment declined as expected! Reason: ${res.error}`);
            },
            className: "w-full p-3.5 bg-red-50 hover:bg-red-100 border border-red-300 rounded-xl text-left transition flex items-center justify-between",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-xs font-black text-red-900",
                children: "Test Card: DECLINE (Declined)"
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-[11px] text-red-700 font-mono",
                children: "•••• •••• •••• 0000"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
              className: "text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-full",
              children: "Simulate Decline"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), showReservationsModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex justify-between items-center pb-4 border-b border-slate-200",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-xl font-black text-slate-900",
            children: "📅 My Table Reservations"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowReservationsModal(false),
            className: "text-slate-400 hover:text-slate-600",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex-1 overflow-y-auto py-4 space-y-3",
          children: userReservations.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
            className: "text-center text-sm text-slate-500 py-10",
            children: "You have no active reservations yet."
          }, void 0, false) : userReservations.map(res => /*#__PURE__*/_jsxDEV("div", {
            className: "p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50/50",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/_jsxDEV("h4", {
                  className: "text-sm font-bold text-slate-900",
                  children: res.restaurant_name
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: `text-[10px] font-black px-2 py-0.5 rounded-full ${res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`,
                  children: res.status
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-slate-500 mt-1",
                children: ["Date: ", /*#__PURE__*/_jsxDEV("strong", {
                  children: res.reservation_date
                }, void 0, false), " at ", /*#__PURE__*/_jsxDEV("strong", {
                  children: res.time_slot
                }, void 0, false), " • ", res.guests, " Guests", res.table_number && ` • Table #${res.table_number}`]
              }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                className: "text-[10px] text-slate-400 font-mono",
                children: ["ID: ", res.id]
              }, void 0, true)]
            }, void 0, true), res.status !== 'CANCELLED' && /*#__PURE__*/_jsxDEV("button", {
              onClick: () => handleCancelReservation(res.id),
              className: "text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition",
              children: "Cancel Booking"
            }, void 0, false)]
          }, res.id, true))
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), showOrdersModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex justify-between items-center pb-4 border-b border-slate-200",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-xl font-black text-slate-900",
            children: "🧾 My Orders & Tracking"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowOrdersModal(false),
            className: "text-slate-400 hover:text-slate-600",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex-1 overflow-y-auto py-4 space-y-4",
          children: userOrders.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
            className: "text-center text-sm text-slate-500 py-10",
            children: "No orders placed yet."
          }, void 0, false) : userOrders.map(order => /*#__PURE__*/_jsxDEV("div", {
            className: "p-4 border border-slate-200 rounded-2xl bg-slate-50/50",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between items-start",
              children: [/*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("h4", {
                  className: "text-sm font-bold text-slate-900",
                  children: order.restaurant_name
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-xs text-slate-500",
                  children: ["Order #", order.id, " • ", new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "text-right",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-sm font-black text-slate-900",
                  children: ["₹", Number(order.total_amount).toFixed(2)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: `inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full ${order.status === 'READY' ? 'bg-green-100 text-green-800' : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' : order.status === 'SERVED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`,
                    children: ["Status: ", order.status]
                  }, void 0, true)
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), order.items && order.items.length > 0 && /*#__PURE__*/_jsxDEV("div", {
              className: "mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-2",
              children: order.items.map(i => /*#__PURE__*/_jsxDEV("span", {
                className: "text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700",
                children: [i.quantity, "x ", i.name]
              }, i.id, true))
            }, void 0, false)]
          }, order.id, true))
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), showAdminModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex justify-between items-center pb-4 border-b border-slate-200",
          children: [/*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "text-xs font-bold text-amber-600 uppercase tracking-wider",
              children: "Management Control"
            }, void 0, false), /*#__PURE__*/_jsxDEV("h3", {
              className: "text-xl font-black text-slate-900",
              children: "⚡ TABLESERVE Admin Panel"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowAdminModal(false),
            className: "text-slate-400 hover:text-slate-600",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex border-b border-slate-200 mt-3 gap-2 overflow-x-auto pb-1",
          children: [{
            id: 'RESTAURANTS',
            label: 'Restaurants'
          }, {
            id: 'KITCHEN_ORDERS',
            label: 'Kitchen Orders'
          }, {
            id: 'MICROSERVICES',
            label: 'Microservices'
          }, {
            id: 'CLOUDWATCH_METRICS',
            label: '📊 CloudWatch Metrics'
          }].map(t => /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setAdminTab(t.id),
            className: `text-xs font-bold py-2 px-4 border-b-2 whitespace-nowrap transition ${adminTab === t.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`,
            children: t.label
          }, t.id, false))
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "flex-1 overflow-y-auto py-4",
          children: [adminTab === 'KITCHEN_ORDERS' && /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-3",
            children: [/*#__PURE__*/_jsxDEV("h4", {
              className: "text-sm font-bold text-slate-800 mb-2",
              children: "Live Kitchen Order Queue"
            }, void 0, false), userOrders.map(order => /*#__PURE__*/_jsxDEV("div", {
              className: "p-3 border border-slate-200 rounded-xl flex items-center justify-between",
              children: [/*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-xs font-bold",
                  children: ["#", order.id, " - ", order.restaurant_name]
                }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs text-slate-500",
                  children: ["Current Status: ", /*#__PURE__*/_jsxDEV("strong", {
                    children: order.status
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-2",
                children: ['PLACED', 'PREPARING', 'READY', 'SERVED'].map(st => /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => handleAdvanceOrderStatus(order.id, st),
                  className: `text-[10px] font-bold px-2.5 py-1 rounded-lg border ${order.status === st ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'}`,
                  children: st
                }, st, false))
              }, void 0, false)]
            }, order.id, true))]
          }, void 0, true), adminTab === 'MICROSERVICES' && /*#__PURE__*/_jsxDEV("div", {
            className: "grid grid-cols-2 gap-4",
            children: [{
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
            }].map(srv => /*#__PURE__*/_jsxDEV("div", {
              className: "p-4 border border-slate-200 rounded-2xl bg-slate-50/50",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex justify-between items-center",
                children: [/*#__PURE__*/_jsxDEV("h4", {
                  className: "text-xs font-bold text-slate-900",
                  children: srv.name
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full",
                  children: srv.status
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-slate-500 mt-1",
                children: ["Port: ", srv.port, " • ", srv.role]
              }, void 0, true)]
            }, srv.name, true))
          }, void 0, false), adminTab === 'CLOUDWATCH_METRICS' && /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-4",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-3",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center gap-3",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  className: "w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-xl",
                  children: "📊"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center gap-2",
                    children: [/*#__PURE__*/_jsxDEV("h4", {
                      className: "font-bold text-sm text-white",
                      children: "Amazon CloudWatch Telemetry Engine"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                      children: [/*#__PURE__*/_jsxDEV("span", {
                        className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                      }, void 0, false), "ACTIVE"]
                    }, void 0, true)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-slate-300 mt-0.5",
                    children: ["Namespace: ", /*#__PURE__*/_jsxDEV("span", {
                      className: "font-mono text-orange-300",
                      children: "TABLESERVE/Microservices"
                    }, void 0, false), " • Region: ", /*#__PURE__*/_jsxDEV("span", {
                      className: "font-mono text-indigo-300",
                      children: "us-east-1"
                    }, void 0, false)]
                  }, void 0, true)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/_jsxDEV("button", {
                  onClick: fetchCloudWatchMetrics,
                  disabled: loadingCloudwatch,
                  className: "text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-xl border border-white/20 transition flex items-center gap-1",
                  children: loadingCloudwatch ? 'Refreshing...' : '🔄 Refresh Metrics'
                }, void 0, false), /*#__PURE__*/_jsxDEV("a", {
                  href: cloudwatchData?.dashboardUrl || "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=TABLESERVE-Operations-Dashboard",
                  target: "_blank",
                  rel: "noreferrer",
                  className: "text-xs bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm",
                  children: "↗ Open AWS Console"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-2 md:grid-cols-4 gap-3",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-3.5 rounded-2xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider",
                  children: "Total Requests"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-2xl font-black text-slate-900 mt-1",
                  children: (cloudwatchData?.summary?.totalRequests || 2840).toLocaleString()
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    children: "↑ 100% Ingested"
                  }, void 0, false)
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-3.5 rounded-2xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider",
                  children: "Response Latency"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-2xl font-black text-orange-600 mt-1",
                  children: [cloudwatchData?.summary?.avgLatencyMs || 28, " ", /*#__PURE__*/_jsxDEV("span", {
                    className: "text-sm font-bold text-slate-500",
                    children: "ms"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-[10px] text-slate-500 mt-1",
                  children: ["p90: ", /*#__PURE__*/_jsxDEV("strong", {
                    children: [cloudwatchData?.summary?.p90LatencyMs || 35, " ms"]
                  }, void 0, true), " • min: ", cloudwatchData?.summary?.minLatencyMs || 15, " ms"]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-3.5 rounded-2xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider",
                  children: "Business Throughput"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-lg font-black text-slate-900 mt-1",
                  children: [cloudwatchData?.summary?.reservationsCount || 48, " ", /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs font-semibold text-slate-500",
                    children: "Tables"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-xs text-slate-600 font-semibold mt-0.5",
                  children: [cloudwatchData?.summary?.ordersCount || 64, " Orders • $", cloudwatchData?.summary?.orderRevenue || '2,845']
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-3.5 rounded-2xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[11px] font-bold text-slate-500 uppercase tracking-wider",
                  children: "AI Bot & Voice"
                }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-lg font-black text-indigo-700 mt-1",
                  children: [cloudwatchData?.summary?.chatbotInteractions || 142, " ", /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs font-semibold text-slate-500",
                    children: "Sessions"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "text-xs text-slate-600 font-semibold mt-0.5",
                  children: ["🎤 ", cloudwatchData?.summary?.voiceAudioInputs || 38, " Voice Audio Inputs"]
                }, void 0, true)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "border border-slate-200 rounded-2xl p-4 bg-white shadow-sm",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center justify-between mb-3",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("h4", {
                    className: "text-xs font-bold text-slate-900 uppercase tracking-wider",
                    children: "CloudWatch Metric Alarms (3 Configured)"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-[11px] text-slate-500",
                    children: "Threshold evaluation via CloudWatch Alarm SNS notifications"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "flex gap-2",
                  children: /*#__PURE__*/_jsxDEV("button", {
                    onClick: () => handleToggleAlarm(!testAlarmTriggered),
                    className: `text-[11px] font-bold px-3 py-1 rounded-lg border transition ${testAlarmTriggered ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'}`,
                    children: testAlarmTriggered ? '✅ Clear Alarm (Restore OK)' : '⚡ Simulate Latency Spike (Test Alarm)'
                  }, void 0, false)
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "grid grid-cols-1 md:grid-cols-3 gap-3",
                children: (cloudwatchData?.alarms || [{
                  name: 'TABLESERVE-High-CPU-Utilization',
                  threshold: '80%',
                  status: 'OK',
                  currentValue: '14.2%',
                  description: 'EC2 host CPU'
                }, {
                  name: 'TABLESERVE-High-API-Latency',
                  threshold: '1000ms',
                  status: 'OK',
                  currentValue: '28ms',
                  description: 'API Gateway latency'
                }, {
                  name: 'TABLESERVE-High-5xx-Error-Rate',
                  threshold: '> 5 errors',
                  status: 'OK',
                  currentValue: '0 errors',
                  description: '5xx Server errors'
                }]).map((alarm, idx) => /*#__PURE__*/_jsxDEV("div", {
                  className: `p-3 rounded-xl border ${alarm.status === 'ALARM' ? 'bg-red-50 border-red-300' : 'bg-emerald-50/50 border-emerald-200'}`,
                  children: [/*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center justify-between",
                    children: [/*#__PURE__*/_jsxDEV("span", {
                      className: `text-[10px] font-black px-2 py-0.5 rounded-full ${alarm.status === 'ALARM' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`,
                      children: alarm.status
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-[11px] font-mono font-bold text-slate-700",
                      children: alarm.currentValue
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("h5", {
                    className: "text-xs font-bold text-slate-900 mt-2 truncate",
                    title: alarm.name,
                    children: alarm.name
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-[10px] text-slate-500 mt-0.5",
                    children: ["Threshold: ", alarm.threshold, " • ", alarm.description]
                  }, void 0, true)]
                }, alarm.name, true))
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-4",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "border border-slate-200 rounded-2xl p-4 bg-slate-50/50",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  className: "flex items-center justify-between mb-3",
                  children: [/*#__PURE__*/_jsxDEV("h4", {
                    className: "text-xs font-bold text-slate-900",
                    children: "Traffic Volume by Microservice"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                    onClick: handleSimulateTraffic,
                    className: "text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 transition",
                    children: "🚀 Simulate +35 Requests"
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "space-y-2",
                  children: Object.entries(cloudwatchData?.services || {
                    'api-gateway': 1420,
                    'search-service': 1190,
                    'restaurant-service': 860,
                    'chatbot-service': 430,
                    'reservation-service': 310,
                    'ordering-service': 245
                  }).map(([srv, count]) => {
                    const maxCount = Math.max(...Object.values(cloudwatchData?.services || {
                      a: 1500
                    }), 1);
                    const pct = Math.min(100, Math.round(count / maxCount * 100));
                    return /*#__PURE__*/_jsxDEV("div", {
                      className: "space-y-1",
                      children: [/*#__PURE__*/_jsxDEV("div", {
                        className: "flex justify-between text-[11px] font-medium",
                        children: [/*#__PURE__*/_jsxDEV("span", {
                          className: "font-mono text-slate-700",
                          children: srv
                        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                          className: "font-bold text-slate-900",
                          children: [count.toLocaleString(), " reqs"]
                        }, void 0, true)]
                      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                        className: "w-full bg-slate-200 rounded-full h-1.5 overflow-hidden",
                        children: /*#__PURE__*/_jsxDEV("div", {
                          className: "bg-orange-500 h-1.5 rounded-full",
                          style: {
                            width: `${pct}%`
                          }
                        }, void 0, false)
                      }, void 0, false)]
                    }, srv, true);
                  })
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("h4", {
                    className: "text-xs font-bold text-slate-900 mb-3",
                    children: "HTTP Status Code Distribution (CloudWatch Metric Filter)"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                    className: "space-y-3",
                    children: [/*#__PURE__*/_jsxDEV("div", {
                      className: "p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between",
                      children: [/*#__PURE__*/_jsxDEV("div", {
                        className: "flex items-center gap-2",
                        children: [/*#__PURE__*/_jsxDEV("span", {
                          className: "w-3 h-3 rounded-full bg-emerald-500"
                        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                          className: "text-xs font-bold text-slate-800",
                          children: "HTTP 2xx Success"
                        }, void 0, false)]
                      }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                        className: "text-xs font-mono font-bold text-emerald-700",
                        children: [(cloudwatchData?.statusCodes?.['2xx'] || 4615).toLocaleString(), " (99.7%)"]
                      }, void 0, true)]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                      className: "p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between",
                      children: [/*#__PURE__*/_jsxDEV("div", {
                        className: "flex items-center gap-2",
                        children: [/*#__PURE__*/_jsxDEV("span", {
                          className: "w-3 h-3 rounded-full bg-amber-500"
                        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                          className: "text-xs font-bold text-slate-800",
                          children: "HTTP 4xx Client Errors"
                        }, void 0, false)]
                      }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                        className: "text-xs font-mono font-bold text-amber-700",
                        children: [(cloudwatchData?.statusCodes?.['4xx'] || 15).toLocaleString(), " (0.3%)"]
                      }, void 0, true)]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                      className: "p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between",
                      children: [/*#__PURE__*/_jsxDEV("div", {
                        className: "flex items-center gap-2",
                        children: [/*#__PURE__*/_jsxDEV("span", {
                          className: "w-3 h-3 rounded-full bg-red-500"
                        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                          className: "text-xs font-bold text-slate-800",
                          children: "HTTP 5xx Server Errors"
                        }, void 0, false)]
                      }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                        className: "text-xs font-mono font-bold text-red-700",
                        children: [(cloudwatchData?.statusCodes?.['5xx'] || 0).toLocaleString(), " (0.0%)"]
                      }, void 0, true)]
                    }, void 0, true)]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "mt-4 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: "ℹ️"
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    children: ["Logged via AWS Embedded Metric Format (EMF) into CloudWatch Logs Group: ", /*#__PURE__*/_jsxDEV("strong", {
                      children: "/aws/tableserve/api-gateway"
                    }, void 0, false)]
                  }, void 0, true)]
                }, void 0, true)]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true), adminTab === 'RESTAURANTS' && /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-slate-500 mb-3",
              children: "Manage registered restaurants across the platform."
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "space-y-2",
              children: restaurants.map(r => /*#__PURE__*/_jsxDEV("div", {
                className: "p-3 border border-slate-200 rounded-xl flex items-center justify-between",
                children: [/*#__PURE__*/_jsxDEV("div", {
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs font-bold text-slate-900",
                    children: r.name
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-[11px] text-slate-500",
                    children: [r.cuisine, " • ", r.city, " • Rating: ", r.rating, "★"]
                  }, void 0, true)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-xs font-bold text-slate-400 font-mono",
                  children: ["ID: ", r.id]
                }, void 0, true)]
              }, r.id, true))
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), showAuthModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex justify-between items-center mb-4",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-black text-slate-900",
            children: authMode === 'LOGIN' ? 'Welcome Back' : 'Create New Account'
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowAuthModal(false),
            className: "text-slate-400 hover:text-slate-600",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), authError && /*#__PURE__*/_jsxDEV("div", {
          className: "mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl",
          children: authError
        }, void 0, false), /*#__PURE__*/_jsxDEV("form", {
          onSubmit: handleAuthSubmit,
          className: "space-y-3",
          children: [authMode === 'REGISTER' && /*#__PURE__*/_jsxDEV(_Fragment, {
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Full Name"
              }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                type: "text",
                required: true,
                value: authForm.name,
                onChange: e => setAuthForm({
                  ...authForm,
                  name: e.target.value
                }),
                className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "block text-xs font-bold text-slate-700 mb-1",
                children: "Role"
              }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
                value: authForm.role,
                onChange: e => setAuthForm({
                  ...authForm,
                  role: e.target.value
                }),
                className: "w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold",
                children: [/*#__PURE__*/_jsxDEV("option", {
                  value: "CUSTOMER",
                  children: "Customer"
                }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
                  value: "ADMIN",
                  children: "Platform Admin"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "block text-xs font-bold text-slate-700 mb-1",
              children: "Email Address"
            }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
              type: "email",
              required: true,
              value: authForm.email,
              onChange: e => setAuthForm({
                ...authForm,
                email: e.target.value
              }),
              className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "block text-xs font-bold text-slate-700 mb-1",
              children: "Password"
            }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
              type: "password",
              required: true,
              value: authForm.password,
              onChange: e => setAuthForm({
                ...authForm,
                password: e.target.value
              }),
              className: "w-full text-xs p-2.5 rounded-xl border border-slate-300"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            type: "submit",
            className: "w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition mt-2",
            children: authMode === 'LOGIN' ? 'Sign In' : 'Create Account'
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "mt-6 pt-4 border-t border-slate-200 text-center",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2",
            children: "1-Click Demo Accounts (For Presentation)"
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "grid grid-cols-2 gap-2",
            children: [/*#__PURE__*/_jsxDEV("button", {
              type: "button",
              onClick: () => handleQuickLogin('CUSTOMER'),
              className: "py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition",
              children: "👤 Customer (Aarav)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
              type: "button",
              onClick: () => handleQuickLogin('ADMIN'),
              className: "py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition",
              children: "⚡ Admin (Supervisor)"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "mt-4",
            children: /*#__PURE__*/_jsxDEV("button", {
              type: "button",
              onClick: () => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setAuthError('');
              },
              className: "text-xs text-orange-600 font-bold hover:underline",
              children: authMode === 'LOGIN' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "fixed bottom-6 right-6 z-50",
      children: !showChatbot ? /*#__PURE__*/_jsxDEV("button", {
        onClick: () => setShowChatbot(true),
        className: "w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/30 hover:scale-105 transition duration-200 group",
        title: "Chat with TABLESERVE Amazon Lex Bot (Voice & Speech enabled)",
        children: [/*#__PURE__*/_jsxDEV("span", {
          className: "text-2xl group-hover:rotate-12 transition",
          children: "🤖"
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          className: "absolute -top-1 -right-1 flex h-3 w-3",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            className: "relative inline-flex rounded-full h-3 w-3 bg-green-500"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
        className: "w-[360px] sm:w-[420px] h-[570px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-3.5 text-white flex items-center justify-between",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center space-x-2.5",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-lg shadow-sm",
              children: "🤖"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("h4", {
                className: "text-xs font-extrabold flex items-center gap-1.5",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  children: "TABLESERVE Assistant"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[9px] bg-orange-500/30 text-orange-300 font-mono px-1.5 py-0.2 rounded border border-orange-500/40",
                  children: "Lex v2 + Voice"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                className: "text-[10px] text-slate-300",
                children: "8 Intents • Multi-Turn Dialogue"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center space-x-1.5",
            children: [/*#__PURE__*/_jsxDEV("button", {
              onClick: () => {
                setVoiceAudioEnabled(!voiceAudioEnabled);
                if (voiceAudioEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
              },
              className: `text-[10px] px-2 py-1 rounded font-mono border transition ${voiceAudioEnabled ? 'bg-orange-500/30 text-orange-200 border-orange-500/40' : 'bg-slate-700 text-slate-400 border-slate-600'}`,
              title: voiceAudioEnabled ? "Voice Audio Replies: ON" : "Voice Audio Replies: MUTED",
              children: voiceAudioEnabled ? '🔊 Audio ON' : '🔇 Muted'
            }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowDialogueTraining(true),
              className: "text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono px-2 py-1 rounded border border-amber-500/30 transition flex items-center gap-1",
              title: "View Amazon Lex Dialogue Training & Multi-Turn State Machine",
              children: /*#__PURE__*/_jsxDEV("span", {
                children: "🧠 Training"
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setShowChatbot(false),
              className: "text-slate-400 hover:text-white text-base p-1 ml-1",
              children: "✕"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70",
          children: [chatMessages.map((msg, idx) => /*#__PURE__*/_jsxDEV("div", {
            className: `flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`,
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: `max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed relative ${msg.sender === 'user' ? 'bg-orange-600 text-white rounded-br-none shadow-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}`,
              children: [/*#__PURE__*/_jsxDEV("p", {
                className: "whitespace-pre-line",
                children: msg.text
              }, void 0, false), msg.intent && msg.sender === 'bot' && /*#__PURE__*/_jsxDEV("div", {
                className: "flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-[9px] text-slate-400 font-mono",
                  children: ["Intent: ", msg.intent]
                }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => speakBotMessage(msg.text),
                  className: "text-[11px] text-slate-400 hover:text-orange-600 transition",
                  title: "Replay Voice Audio",
                  children: "🔊 Play Voice"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
              className: "text-[9px] text-slate-400 mt-0.5 px-1",
              children: msg.time
            }, void 0, false)]
          }, idx, true)), chatLoading && /*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center space-x-1.5 p-3 bg-white border border-slate-200 rounded-2xl max-w-[80px]",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce",
              style: {
                animationDelay: '0.2s'
              }
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce",
              style: {
                animationDelay: '0.4s'
              }
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            ref: chatEndRef
          }, void 0, false)]
        }, void 0, true), isListening && /*#__PURE__*/_jsxDEV("div", {
          className: "px-3 py-1.5 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-600 animate-pulse",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "flex items-center gap-1.5 font-semibold",
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "w-2 h-2 rounded-full bg-red-500 animate-ping"
            }, void 0, false), "Listening to your microphone... Speak now!"]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: toggleVoiceRecording,
            className: "text-[10px] underline hover:text-red-800 font-bold",
            children: "Cancel"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]",
          children: [/*#__PURE__*/_jsxDEV("button", {
            onClick: () => handleSendChatMessage('Book a table'),
            className: "whitespace-nowrap px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 rounded-full font-semibold transition",
            children: "📅 Book a Table"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => handleSendChatMessage('Find Biryani in Hyderabad'),
            className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition",
            children: "🍛 Find Biryani"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => handleSendChatMessage('Show menu for Bukhara'),
            className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition",
            children: "📖 Bukhara Menu"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => handleSendChatMessage('Check my reservation status'),
            className: "whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-full font-semibold text-slate-600 transition",
            children: "📋 My Status"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-3 bg-white border-t border-slate-200 flex items-center gap-2",
          children: [/*#__PURE__*/_jsxDEV("button", {
            type: "button",
            onClick: toggleVoiceRecording,
            title: isListening ? "Listening... Click to stop" : "Speak using Microphone (Speech-to-Text)",
            className: `w-9 h-9 rounded-xl border flex items-center justify-center transition text-base ${isListening ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-md shadow-red-500/30' : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200'}`,
            children: isListening ? '🔴' : '🎤'
          }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
            type: "text",
            placeholder: isListening ? "Listening to your voice..." : "Type or speak your request...",
            value: chatInput,
            onChange: e => setChatInput(e.target.value),
            onKeyDown: e => e.key === 'Enter' && handleSendChatMessage(),
            className: "flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => handleSendChatMessage(),
            disabled: chatLoading,
            className: "bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1 shadow-sm shadow-orange-600/30",
            children: /*#__PURE__*/_jsxDEV("span", {
              children: "Send"
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), showDialogueTraining && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-5 text-white flex items-center justify-between",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center space-x-3",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-xl shadow-sm",
              children: "🧠"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("h3", {
                className: "text-base font-extrabold flex items-center gap-2",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  children: "Amazon Lex v2 Dialogue Training & NLU Model"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] bg-green-500/20 text-green-300 font-mono px-2 py-0.5 rounded border border-green-500/40",
                  children: "TRAINED & VERIFIED"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-slate-300",
                children: "Multi-Turn Context State Machine • Voice Speech Synthesis • NLU Threshold 0.40"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowDialogueTraining(false),
            className: "text-slate-400 hover:text-white text-xl p-1.5 rounded-lg hover:bg-white/10 transition",
            children: "✕"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-6 overflow-y-auto space-y-6 text-xs text-slate-700 bg-slate-50/50",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm",
            children: [/*#__PURE__*/_jsxDEV("h4", {
              className: "font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "🔄 Multi-Turn Conversational Dialogue Flow"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "text-[10px] bg-orange-100 text-orange-700 font-mono px-2 py-0.5 rounded",
                children: "sessionAttributes Tracking"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
              className: "text-slate-600 mb-3",
              children: "The bot tracks context state across multiple customer turns to fulfill end-to-end table booking and restaurant discovery without requiring repeated inputs:"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-2.5 rounded-xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-orange-600 font-bold block mb-1",
                  children: "Turn 1: Intent"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-slate-700",
                  children: "\"Book a table\""
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] text-slate-400 block mt-1",
                  children: "→ ElicitSlot: Restaurant"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-2.5 rounded-xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-orange-600 font-bold block mb-1",
                  children: "Turn 2: Slot 1"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-slate-700",
                  children: "\"Bukhara\""
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] text-slate-400 block mt-1",
                  children: "→ ElicitSlot: Guests"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-slate-50 border border-slate-200 p-2.5 rounded-xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-orange-600 font-bold block mb-1",
                  children: "Turn 3: Slot 2"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-slate-700",
                  children: "\"4 guests\""
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] text-slate-400 block mt-1",
                  children: "→ ElicitSlot: Time"
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "bg-green-50 border border-green-200 p-2.5 rounded-xl",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "text-green-700 font-bold block mb-1",
                  children: "Turn 4: Complete"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-slate-700",
                  children: "\"8:00 PM\""
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-[10px] text-green-600 block mt-1",
                  children: "→ Atomic Lock + SNS Email!"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm",
            children: [/*#__PURE__*/_jsxDEV("h4", {
              className: "font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "🎯 8 Amazon Lex Trained Intents"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded",
                children: "aws/lex/tableserve-lex-bot.json"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "overflow-x-auto",
              children: /*#__PURE__*/_jsxDEV("table", {
                className: "w-full text-left border-collapse text-[11px]",
                children: [/*#__PURE__*/_jsxDEV("thead", {
                  children: /*#__PURE__*/_jsxDEV("tr", {
                    className: "border-b border-slate-200 text-slate-500 font-semibold",
                    children: [/*#__PURE__*/_jsxDEV("th", {
                      className: "py-2 px-2",
                      children: "Intent Name"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                      className: "py-2 px-2",
                      children: "Sample Utterances (Trained Phrases)"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                      className: "py-2 px-2",
                      children: "Slots Extracted"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                      className: "py-2 px-2",
                      children: "Fulfillment Action"
                    }, void 0, false)]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
                  className: "divide-y divide-slate-100 font-sans",
                  children: [/*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "GreetingIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"hi\", \"hello\", \"namaste\", \"good morning\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-400",
                      children: "None"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Welcomes & announces voice capabilities"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "RestaurantSearchIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"find Biryani in Hyderabad\", \"North Indian in Delhi\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-700",
                      children: [`{Cuisine}`, ", ", `{City}`]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Fuzzy query on 18 regional restaurants"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "MenuIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"show menu for Bukhara\", \"what dishes do you have\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-700",
                      children: `{RestaurantName}`
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Fetches 58 dishes with INR ₹ pricing"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "ReservationIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"book a table\", \"reserve table for 4 at 8 PM\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-700",
                      children: [`{Restaurant}`, ", ", `{Guests}`, ", ", `{Time}`]
                    }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Atomic double-booking prevention + SNS"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "ReservationStatusIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"check status of res-01\", \"my booking status\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-700",
                      children: `{ReservationId}`
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Queries database status & table number"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "CancelReservationIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"cancel reservation res-01\", \"cancel booking\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-700",
                      children: `{ReservationId}`
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Releases table slot back into availability"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "HelpIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "\"help\", \"what can you do\", \"how to use\""
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-400",
                      children: "None"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Provides guided action commands"
                    }, void 0, false)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("tr", {
                    children: [/*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono font-bold text-orange-600",
                      children: "FallbackIntent"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-600",
                      children: "Unexpected or out-of-domain phrases"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 font-mono text-slate-400",
                      children: "None"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                      className: "py-2 px-2 text-slate-700",
                      children: "Graceful recovery with suggested prompt chips"
                    }, void 0, false)]
                  }, void 0, true)]
                }, void 0, true)]
              }, void 0, true)
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm",
            children: [/*#__PURE__*/_jsxDEV("h4", {
              className: "font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-2",
              children: [/*#__PURE__*/_jsxDEV("span", {
                children: "🎙️ Voice Audio & Speech Synthesis Architecture"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "text-[10px] bg-blue-100 text-blue-700 font-mono px-2 py-0.5 rounded",
                children: "Two-Way Voice (STT & TTS)"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "p-3 bg-slate-50 rounded-xl border border-slate-200",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "font-bold text-slate-900 block mb-1",
                  children: "🎤 Speech-to-Text (Voice Input)"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-[11px]",
                  children: "Users click the microphone button to speak naturally. The Web Speech Recognition engine transcribes voice audio in real time and submits it into the NLU intent classification pipeline."
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "p-3 bg-slate-50 rounded-xl border border-slate-200",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "font-bold text-slate-900 block mb-1",
                  children: "🔊 Text-to-Speech (Voice Output)"
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-[11px]",
                  children: "Integrated with speech synthesis (emulating Amazon Polly neural voices). The concierge converts intent fulfillment text into clear spoken voice with natural pacing, toggleable via the audio controls."
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs",
          children: [/*#__PURE__*/_jsxDEV("span", {
            className: "text-slate-500 font-mono",
            children: "NLU Model: Lex v2 • Voice Rate: 1.0x • AWS Cloud Ready"
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setShowDialogueTraining(false),
            className: "bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition",
            children: "Close Training Explorer"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV("footer", {
      className: "bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2",
        children: [/*#__PURE__*/_jsxDEV("p", {
          className: "font-bold text-slate-200 text-sm",
          children: "TABLESERVE • Enterprise Restaurant Reservation and Ordering Platform"
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-slate-500",
          children: "Microservices: Restaurant (5001) | Reservation & Payment (5002) | Ordering (5003) | Search (5004) | Gateway (5000)"
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-slate-600",
          children: "Powered by React, Express, PostgreSQL, Docker, AWS Architecture & Amazon Lex"
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}

// Render into root element
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/_jsxDEV(App, {}, void 0, false));