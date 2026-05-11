import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getCookie } from '../middelwaie/cookie';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Footer from './futer';
import Navbar from './navbar';
import backend_Url from '../backend_url_return_function/backendUrl';

// --- SVGs for Icons ---
const Icons = {
  ChevronDown: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronUp: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  ShoppingBag: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Phone: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  MapPin: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Currency: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Trash: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Clock: ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const UsersWithOrdersPage = () => {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsersWithOrders = async () => {
      const token = getCookie('authToken');
      if (!token) {
        toast.error('Please login to view this page');
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (!decoded?.phone) throw new Error('Invalid token');

        const response = await axios.get(
          `${backend_Url}/production/getUsersWithOrders`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.data.status) {
          setUsers(response.data.users || []);
          setStatistics(response.data.statistics || null);
        } else {
          setError(response.data.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUsersWithOrders();
  }, [navigate]);

  const handleRemoveOrder = async (userId, orderId) => {
    const token = getCookie('authToken');
    if (!token) {
      toast.error('Authentication token missing');
      return;
    }

    try {
      const response = await axios.post(`${backend_Url}/user/remove/order`, {
        token: token,
        userId: userId,
        orderId: orderId
      });

      if (response.data.success) {
        toast.success('Order removed successfully');
        
        // Update local state
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => {
            if (user._id === userId) {
              const updatedOrders = user.orders.filter(order => order._id !== orderId);
              return { ...user, orders: updatedOrders, totalOrders: updatedOrders.length };
            }
            return user;
          }).filter(user => user.orders.length > 0); // Remove users with no orders
          
          return updatedUsers;
        });
      } else {
        toast.error('Failed to remove order');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing order');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const toggleExpand = (id) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar />
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
      
      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-slate-900 tracking-tight"
              >
                Order Management
              </motion.h1>
              <p className="text-slate-500 mt-1">Overview of all customers and their orders</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <StatCard 
              label="Total Customers" 
              value={statistics?.totalUsers || 0} 
              color="bg-blue-500" 
              icon={<Icons.Phone className="w-6 h-6 text-white" />} 
            />
            <StatCard 
              label="Total Orders" 
              value={statistics?.totalOrders || 0} 
              color="bg-indigo-500" 
              icon={<Icons.ShoppingBag className="w-6 h-6 text-white" />} 
            />
            <StatCard 
              label="Total Revenue" 
              value={`₹${(statistics?.totalRevenue || 0).toLocaleString()}`} 
              color="bg-emerald-500" 
              icon={<Icons.Currency className="w-6 h-6 text-white" />} 
            />
            <StatCard 
              label="Avg Order Value" 
              value={`₹${(statistics?.averageOrderValue || 0).toLocaleString()}`} 
              color="bg-purple-500" 
              icon={<Icons.Currency className="w-6 h-6 text-white" />} 
            />
          </motion.div>

          {/* Users List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-semibold text-slate-800">Customer Orders</h2>
            </div>
            
            {users.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((user, index) => (
                  <UserRow 
                    key={user._id || index} 
                    user={user} 
                    index={index} 
                    isExpanded={expandedUserId === (user._id || index)}
                    onToggle={() => toggleExpand(user._id || index)}
                    onRemoveOrder={handleRemoveOrder}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`${color} p-3 rounded-lg shadow-md`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const UserRow = ({ user, isExpanded, onToggle, onRemoveOrder, getStatusColor, formatDate }) => {
  return (
    <div className="group transition-colors hover:bg-slate-50">
      <div 
        onClick={onToggle}
        className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={user.imageURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
              alt={user.name} 
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
              }}
            />
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {user.name}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 gap-y-1 gap-x-3">
              <span className="flex items-center"><Icons.Phone className="w-3 h-3 mr-1" /> {user.phone_number}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center"><Icons.MapPin className="w-3 h-3 mr-1" /> {user.address?.substring(0, 50) || 'No address'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 min-w-[200px]">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Orders / Total</p>
            <div className="flex items-center justify-end space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {user.totalOrders || user.orders?.length || 0} Items
              </span>
              <span className="font-semibold text-slate-700">₹{(user.totalSpent || 0).toLocaleString()}</span>
            </div>
          </div>
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Icons.ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-slate-50 border-t border-slate-100"
          >
            <div className="p-5 sm:p-8">
              <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Order Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {user.orders?.map((order, idx) => (
                  <OrderCard 
                    key={order._id || idx} 
                    order={order} 
                    userId={user._id}
                    onRemove={onRemoveOrder}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrderCard = ({ order, userId, onRemove, getStatusColor, formatDate }) => {
  const foodItem = order.foodItem || {};
  const quantity = order.quantity || 1;
  const priceAtPurchase = order.priceAtPurchase || foodItem.price || 0;
  const totalAmount = priceAtPurchase * quantity;
  const productImage = foodItem.images?.[0] || "https://placehold.co/400x300?text=No+Image";

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col group"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={productImage}
          alt={foodItem.title || 'Product'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://placehold.co/400x300?text=No+Image";
          }}
        />
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusColor(order.status)}`}>
            {order.status || 'Pending'}
          </span>
        </div>
        {quantity > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
            {quantity} items
          </div>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h5 className="font-semibold text-slate-900 mb-1 line-clamp-1">
            {foodItem.title || 'Product'}
          </h5>
          <p className="text-xs text-slate-500 mb-2 font-mono">
            Order ID: {order._id?.slice(-8)}
          </p>
          {order.orderDate && (
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
              <Icons.Clock className="w-3 h-3" />
              {formatDate(order.orderDate)}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Quantity:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Price each:</span>
            <span className="font-medium">₹{priceAtPurchase}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
            <span className="font-semibold text-slate-700">Total:</span>
            <span className="font-bold text-slate-900">₹{totalAmount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
          <button 
            onClick={() => onRemove(userId, order._id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1 text-sm"
            title="Delete Order"
          >
            <Icons.Trash className="w-4 h-4" />
            Remove
          </button>
          <div className="text-xs text-slate-400">
            {foodItem.category || 'General'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <div className="text-center py-20">
    <div className="bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
      <Icons.ShoppingBag className="w-10 h-10 text-slate-300" />
    </div>
    <h3 className="text-lg font-medium text-slate-900">No orders found</h3>
    <p className="text-slate-500 mt-1 max-w-sm mx-auto">
      No customers have placed orders yet. Orders will appear here once customers make purchases.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium animate-pulse">Loading customer orders...</p>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-red-100">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to load data</h3>
      <p className="text-slate-500 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
        Try Again
      </button>
    </div>
  </div>
);

export default UsersWithOrdersPage;