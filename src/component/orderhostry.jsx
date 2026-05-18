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
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleOpenReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setIsReviewModalOpen(true);
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
          <header className="mb-12 text-center md:text-left">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
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
                    onReviewClick={() => handleOpenReviewModal(order)} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedOrderForReview(null);
        }} 
        order={selectedOrderForReview} 
      />

      <Footer />
    </div>
  );
};

// --- Order Card Component ---
const OrderCard = ({ order, index, navigate, getStatusColor, formatDate, onReviewClick }) => {
  const foodItem = order.foodItem || {};
  const quantity = order.quantity || 1;
  const priceAtPurchase = order.priceAtPurchase || foodItem.price || 0;
  const status = order.status || 'Pending';
  const totalAmount = priceAtPurchase * quantity;
  const orderDate = order.orderDate;
  const productImage = foodItem.images?.[0] || foodItem.pic_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={productImage} alt={foodItem.title || 'Product'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"; }}
        />
        <div className="absolute top-4 left-4">
          <span className={`backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {foodItem.title || 'Product'}
          </h3>
          <div className="text-right">
            <span className="text-xl font-black text-slate-900 dark:text-white">₹{totalAmount}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Quantity:</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{quantity}</span>
          </div>
          {orderDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Date:</span>
              <span className="text-slate-700 dark:text-slate-300 text-xs">{formatDate(orderDate)}</span>
            </div>
          )}
        </div>

        {/* Removed 'Buy Again' and aligned the Review button */}
        <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-end">
          <div className="flex gap-4">
            {status.toLowerCase() === 'delivered' && (
              <button
                onClick={onReviewClick}
                className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Review
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- NEW: Review Modal Component ---
const ReviewModal = ({ isOpen, onClose, order }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // State for previewing images
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment('');
      setImages([]);
      setImagePreviews([]); // Clear previews on open
      setIsSubmitting(false);
    }
  }, [isOpen, order]);

  // Clean up object URLs to avoid memory leaks when component unmounts or previews change
  useEffect(() => {
    return () => {
        imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  if (!isOpen || !order) return null;

  const foodItem = order.foodItem || {};

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Combine existing images with newly selected ones
    const combinedFiles = [...images, ...files];

    if (combinedFiles.length > 5) {
      toast.error('You can only upload up to 5 images.');
      // Keep only the first 5
      const limitedFiles = combinedFiles.slice(0, 5);
      setImages(limitedFiles);
      setImagePreviews(limitedFiles.map(file => URL.createObjectURL(file)));
    } else {
      setImages(combinedFiles);
      setImagePreviews(combinedFiles.map(file => URL.createObjectURL(file)));
    }
    
    // Reset input value so the user can select the same file again if they deleted it
    e.target.value = ''; 
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews(prev => {
        // Revoke the URL being removed to free memory
        URL.revokeObjectURL(prev[indexToRemove]);
        return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please write a review comment.');
    
    setIsSubmitting(true);
    const token = getCookie('authToken');

    const formData = new FormData();
    formData.append('productId', foodItem._id);
    formData.append('rating', rating);
    formData.append('comment', comment);
    formData.append('token', token)
    
    images.forEach((file) => {
      formData.append('pic_url_file', file);
    });

    try {
      if(token){
        const response = await axios.post(
        `${backend_Url}/production/addReview`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success || response.data.status) {
        toast.success(response.data.message || 'Review submitted successfully!');
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to submit review.');
      }
      }
      else{
        toast.error('token not found')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Write a Review</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[85vh]">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            How was the <span className="font-bold text-slate-700 dark:text-slate-300">{foodItem.title}</span>?
          </p>

          <div className="mb-5 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95" 
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-10 h-10 transition-colors duration-200 ${
                    star <= rating 
                      ? 'text-yellow-400' 
                      : 'text-gray-200 dark:text-slate-600'
                  }`}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Review</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you loved about this product..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Add Photos <span className="text-slate-400 text-xs font-normal">(Max 5)</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              disabled={images.length >= 5}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 disabled:opacity-50"
            />
            
            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-600">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-red-700 rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                {images.length}/5 images selected
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-blue-500 transition-all ${
              isSubmitting 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900/40'
            }`}
          >
            {isSubmitting ? 'Uploading Review...' : 'Submit Review'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const EmptyState = ({ navigate }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-inner dark:shadow-none transition-colors duration-300">
    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-full mb-6">
        <svg className="h-16 w-16 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    </div>
    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No orders yet</h3>
    <p className="mt-2 text-slate-500 dark:text-slate-400 text-center max-w-xs">Start shopping to see your order history here!</p>
    <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
      Start Shopping
    </button>
  </motion.div>
);

export default OrdersPage;