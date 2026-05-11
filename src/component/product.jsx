import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getCookie } from '../middelwaie/cookie';
import { jwtDecode } from 'jwt-decode';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './futer';
import Navbar from './navbar';
import backend_Url from '../backend_url_return_function/backendUrl';

function Product() {
  const location = useLocation();
  const navigate = useNavigate();

  // Safe destructuring with all the new apparel fields
  const {
    id,
    images,
    url, // Fallback for old data
    title,
    price,
    originalPrice,
    discount,
    description,
    brand,
    sizes = [],
    colors = []
  } = location.state || {};

  // Create a normalized image array (fallback to url if images array is missing)
  const imageList = images && images.length > 0 ? images : (url ? [url] : ['https://via.placeholder.com/600x800?text=No+Image']);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [userPhone, setUserPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCod, setLoadingCod] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userToken, setUserToken] = useState('');

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // If no state exists (user navigated directly to URL), redirect back
    if (!location.state) {
      navigate('/');
      return;
    }

    const token = getCookie('authToken');
    if (token) {
      try {
        setUserToken(token);
        const decoded = jwtDecode(token);

        if (decoded && decoded.phone) {
          setUserPhone(decoded.phone);
        } else {
          toast.error('Session invalid. Please login again.');
          navigate('/login');
        }
      } catch (error) {
        console.error("Token decode error:", error);
        navigate('/login');
      }
    } else {
      // It's common in e-commerce to allow viewing without login, 
      // but redirect if they try to buy. Kept your original logic here.
      navigate('/register');
    }
  }, [navigate, location.state]);

  // Validation helper
  const validateSelection = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return false;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!userPhone) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (!validateSelection()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${backend_Url}/api/v1/orders/payment`,
        {
          name: title,
          amount: price * quantity,
          FOODorderID: id,
          token: userToken
          // Note: You can add size/color to this payload later if your backend supports it
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error(response.data.message || 'Failed to place order');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Payment initiation failed');
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const openConfirmation = () => {
    if (!validateSelection()) return;
    setShowConfirmModal(true);
  };

  const handleCashOnDelivery = async () => {
    setShowConfirmModal(false);

    if (!userPhone) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoadingCod(true);
    try {
      const response = await axios.post(
        `${backend_Url}/production/order`,
        {
          token: userToken,
          orderID: id,
          after_discount_final_price: price,
          quantity: quantity,  // ← ADD THIS: Send the quantity to backend
          // Also send size and color if your schema supports it
          selectedSize: selectedSize,
          selectedColor: selectedColor
        }
      );

      if (response.data.status) {
        toast.success(response.data.message || 'Order placed successfully.');
        navigate('/ordersuccess');
      } else {
        toast.error(response.data.message || 'User not found or order was not updated.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Oops, something went wrong. Please try again later.');
    } finally {
      setLoadingCod(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  if (!location.state) return null;

  return (
    <div className="min-h-screen w-screen bg-white flex flex-col relative font-sans">
      <Navbar />
      <Toaster position="top-right" />

      {/* --- Confirmation Modal --- */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Order</h3>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-gray-700">
                <p className="font-semibold text-base mb-1">{quantity}x {title}</p>
                {selectedSize && <p>Size: <span className="font-medium">{selectedSize}</span></p>}
                {selectedColor && <p>Color: <span className="font-medium">{selectedColor}</span></p>}
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-lg">
                  <span>Total to Pay:</span>
                  <span className="text-emerald-600">₹{price * quantity}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashOnDelivery}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Confirm COD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex justify-center py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl w-full bg-white rounded-3xl overflow-hidden"
        >
          {/* Main Grid Layout for E-commerce */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">

            {/* LEFT: Image Gallery Section */}
            <div className="flex flex-col gap-4">
              {/* Main Display Image */}
              <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full rounded-2xl bg-gray-100 overflow-hidden border border-gray-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={imageList[currentImageIndex]}
                    alt={`${title} - view ${currentImageIndex + 1}`}
                  />
                </AnimatePresence>
              </div>

              {/* Thumbnails Row */}
              {imageList.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {imageList.map((imgSrc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-24 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 transition-all duration-200
                         ${currentImageIndex === idx ? 'border-emerald-500 shadow-md' : 'border-transparent hover:border-gray-300'}
                       `}
                    >
                      <img src={imgSrc} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      {currentImageIndex !== idx && <div className="absolute inset-0 bg-white/40"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Details Section */}
            <div className="py-6 lg:py-0 flex flex-col">

              {/* Brand & Badges */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">
                  {brand || 'Apparel'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wider">
                  In Stock
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
                {title}
              </h1>

              {/* Pricing */}
              <div className="mb-6 flex flex-col gap-1">
                {discount && discount > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-gray-400 line-through font-medium">
                        ₹{originalPrice}
                      </span>
                      <span className="bg-red-50 text-red-600 text-sm font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        {discount}% OFF
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-gray-900">₹{price}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-gray-900">₹{price}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200 w-full mb-6"></div>

              {/* Sizes Selector */}
              {sizes && sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Select Size</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 text-sm font-bold transition-all
                          ${selectedSize === size
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors Selector */}
              {colors && colors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Select Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold capitalize transition-all
                          ${selectedColor === color
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Product Details</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Quantity & Total */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Quantity</label>
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 w-fit shadow-sm">

                    <button
                      onClick={() => handleQuantityChange(-1)}  // ← FIX THIS
                      className="p-3 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-30"
                      disabled={quantity <= 1 || loading || loadingCod}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleQuantityChange(1)}  // ← FIX THIS
                      className="p-3 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-30"
                      disabled={quantity >= 10 || loading || loadingCod}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900 text-lg select-none">{quantity}</span>

                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Subtotal</p>
                  <p className="text-2xl font-black text-gray-900">₹{price * quantity}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                <button
                  disabled={true}
                  className="w-full py-4 rounded-xl text-base font-bold transition-all bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 flex justify-center items-center gap-2"
                >
                  <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Pay Online (Currently Unavailable)
                </button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openConfirmation}
                  disabled={loading || loadingCod}
                  className={`w-full py-4 px-6 rounded-xl text-base font-bold shadow-lg transition-all 
                    ${loading || loadingCod
                      ? 'bg-emerald-400 cursor-not-allowed text-white shadow-none'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                    }`}
                >
                  {loadingCod || loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span className=' text-black'>Place Order (Cash on Delivery)</span>
                  )}
                </motion.button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default Product;