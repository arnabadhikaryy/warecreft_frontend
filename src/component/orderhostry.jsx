import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCookie } from '../middelwaie/cookie';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './futer';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './navbar';
import backend_Url from '../backend_url_return_function/backendUrl';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = getCookie('authToken');
      if (!token) {
        toast.error('Please login to view orders');
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (!decoded?.phone) throw new Error('Invalid token');

        const response = await axios.post(
          `${backend_Url}/production/my/all/orders`,
          { token },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.status) {
          setOrders(response.data.orders || []);
        } else {
          setError(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full"
        />
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium tracking-wide">Fetching your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col">
        <Navbar />
        <Toaster position="top-center" gutter={12} />
        <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
          <div className="text-center">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Failed to load orders</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <Navbar />
      <Toaster position="top-center" gutter={12} />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-12 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Order <span className="text-indigo-600 dark:text-indigo-400">History</span>
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg">
                Track and manage all your orders
              </p>
              {orders.length > 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Total Orders: {orders.length}
                </p>
              )}
            </motion.div>
          </header>

          {orders.length === 0 ? (
            <EmptyState navigate={navigate} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {orders.map((order, index) => (
                  <OrderCard 
                    key={order._id || index} 
                    order={order} 
                    index={index} 
                    navigate={navigate}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

// --- Order Card Component ---
const OrderCard = ({ order, index, navigate, getStatusColor, formatDate }) => {
  // Extract data from the order structure based on your API response
  const foodItem = order.foodItem || {};
  const quantity = order.quantity || 1;
  const priceAtPurchase = order.priceAtPurchase || foodItem.price || 0;
  const status = order.status || 'Pending';
  const totalAmount = priceAtPurchase * quantity;
  const orderDate = order.orderDate;
  
  // Get the first image from images array or use fallback
  const productImage = foodItem.images?.[0] || foodItem.pic_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
  
  // Calculate discounted price if discount exists
  const getDiscountedPrice = () => {
    if (foodItem.discount && foodItem.discount > 0 && foodItem.price) {
      return Math.round(foodItem.price - (foodItem.discount / 100) * foodItem.price);
    }
    return foodItem.price;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={productImage} 
          alt={foodItem.title || 'Product'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
          }}
        />
        <div className="absolute top-4 left-4">
          <span className={`backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        {quantity > 1 && (
          <div className="absolute top-4 right-4">
            <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              {quantity} items
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {foodItem.title || 'Product'}
          </h3>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 dark:text-white">₹{totalAmount}</span>
            {quantity > 1 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                ₹{priceAtPurchase} each
              </p>
            )}
          </div>
        </div>

        {/* Category and Type Badges */}
        {(foodItem.category || foodItem.type) && (
          <div className="flex gap-2 mt-2 mb-3">
            {foodItem.category && (
              <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
                {foodItem.category}
              </span>
            )}
            {foodItem.type && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                {foodItem.type}
              </span>
            )}
          </div>
        )}

        {foodItem.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
            {foodItem.description}
          </p>
        )}

        {/* Order Details */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Order ID:</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
              {order._id?.substring(0, 12)}...
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Quantity:</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Price at purchase:</span>
            <span className="text-slate-700 dark:text-slate-300">₹{priceAtPurchase}</span>
          </div>
          {orderDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Order Date:</span>
              <span className="text-slate-700 dark:text-slate-300 text-xs">
                {formatDate(orderDate)}
              </span>
            </div>
          )}
        </div>

        {/* Size and Color if available */}
        {(foodItem.sizes?.length > 0 || foodItem.colors?.length > 0) && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {foodItem.sizes?.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Sizes:</span>
                <div className="flex gap-1">
                  {foodItem.sizes.slice(0, 3).map((size, idx) => (
                    <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {size}
                    </span>
                  ))}
                  {foodItem.sizes.length > 3 && (
                    <span className="text-slate-400">+{foodItem.sizes.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => {
              navigate('/product', {
                state: { 
                  id: foodItem._id, 
                  images: foodItem.images || [],
                  url: productImage,
                  title: foodItem.title, 
                  price: getDiscountedPrice(),
                  originalPrice: foodItem.price,
                  discount: foodItem.discount,
                  description: foodItem.description,
                  brand: foodItem.brand,
                  sizes: foodItem.sizes || [],
                  colors: foodItem.colors || []
                },
              });
            }}
            className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 group/btn"
          >
            Buy Again
            <svg className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ navigate }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-inner dark:shadow-none transition-colors duration-300"
  >
    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-full mb-6 transition-colors duration-300">
        <svg className="h-16 w-16 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    </div>
    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No orders yet</h3>
    <p className="mt-2 text-slate-500 dark:text-slate-400 text-center max-w-xs">
      Start shopping to see your order history here!
    </p>
    <button
      onClick={() => navigate('/')}
      className="mt-8 px-8 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40 transition-all active:scale-95"
    >
      Start Shopping
    </button>
  </motion.div>
);

export default OrdersPage;