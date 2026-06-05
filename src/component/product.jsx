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
import { load } from '@cashfreepayments/cashfree-js';
import { payment_mode } from '../backend_url_return_function/backendUrl';

function Product() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    id,
    images,
    url,
    title,
    price,
    originalPrice,
    discount,
    description,
    brand,
    sizes = [],
    colors = [],
    likes = 0
  } = location.state || {};

  const imageList = images && images.length > 0 ? images : (url ? [url] : ['https://placehold.co/600x800?text=URBAN+DROP']);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [userPhone, setUserPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCod, setLoadingCod] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userToken, setUserToken] = useState('');

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
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
    }
  }, [navigate, location.state]);

  useEffect(() => {
    const checkCartStatus = async () => {
      if (!userToken || !id) return;
      try {
        const response = await axios.post(`${backend_Url}/user/check/cart`, {
          productId: id,
          token: userToken
        });
        if (response.data.inCart) setIsInCart(true);
      } catch (error) {
        console.error("Error checking cart status:", error);
      }
    };
    checkCartStatus();
  }, [userToken, id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const response = await axios.post(`${backend_Url}/production/getProductReviews`, { productId: id });
        if (response.data.success) {
          setReviews(response.data.reviews || []);
          setReviewStats(response.data.stats || { averageRating: 0, totalReviews: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!userToken) {
      toast.error("Please log in to like products!");
      return;
    }
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    try {
      const response = await axios.post(`${backend_Url}/production/toggleLikeProduct`, {
        productId: id,
        token: userToken
      });
      if (response.data.success) {
        setIsLiked(response.data.isLiked);
      } else {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
        toast.error(response.data.message || "Failed to update like.");
      }
    } catch (error) {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error("Error toggling like:", error);
      toast.error("Something went wrong!");
    }
  };

  const handleAddToCart = async () => {
    if (!userToken) {
      toast.error("Please log in to add items to cart!");
      navigate('/login');
      return;
    }
    setCartLoading(true);
    try {
      const response = await axios.post(`${backend_Url}/user/add/cart`, {
        productId: id,
        token: userToken
      });
      if (response.data.message.includes("successfully")) {
        setIsInCart(true);
        toast.success("Product added to cart!");
      } else {
        toast.error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setCartLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!userToken) {
      toast.error("Please log in!");
      navigate('/login');
      return;
    }
    setCartLoading(true);
    try {
      const response = await axios.post(`${backend_Url}/user/remove/cart`, {
        productId: id,
        token: userToken
      });
      if (response.data.message.includes("successfully")) {
        setIsInCart(false);
        toast.success("Product removed from cart!");
      } else {
        toast.error(response.data.message || "Failed to remove from cart");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setCartLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!validateSelection()) return;
    if (!userPhone) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const cashfree = await load({ mode: payment_mode });
      const orderResponse = await axios.post(`${backend_Url}/api/v1/orders/payment`, {
        amount: price * quantity,
        name: title,
        phone: userPhone,
        orderID: id
      });
      if (orderResponse.data.success) {
        let checkoutOptions = {
          paymentSessionId: orderResponse.data.payment_session_id,
          redirectTarget: "_modal",
        };
        cashfree.checkout(checkoutOptions).then(async (result) => {
          if (result.error) {
            toast.error(result.error.message || "Payment cancelled");
            setLoading(false);
          }
          if (result.paymentDetails) {
            toast.loading("Verifying payment...");
            const verifyResponse = await axios.post(`${backend_Url}/api/v1/orders/verify`, {
              cf_order_id: orderResponse.data.order_id,
              userPhone: userPhone,
              foodOrderID: id,
              price: price,
              quantity: quantity
            });
            toast.dismiss();
            if (verifyResponse.data.success) {
              toast.success("Order placed successfully!");
              navigate('/ordersuccess');
            } else {
              toast.error("Payment verification failed.");
              setLoading(false);
            }
          }
        });
      } else {
        toast.error('Failed to initiate payment');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

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
      const response = await axios.post(`${backend_Url}/production/order`, {
        token: userToken,
        orderID: id,
        after_discount_final_price: price,
        quantity: quantity,
        selectedSize: selectedSize,
        selectedColor: selectedColor
      });
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

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!location.state) return null;

  return (
    <div className="h-full w-screen bg-black text-white font-sans">
      <Navbar />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' }
      }} />

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-50"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Fullscreen view"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black border border-white/20 rounded-none p-6 md:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter text-white mb-2">Confirm Order</h3>

              <div className="bg-white/5 p-4 mb-6 text-sm text-gray-300 border border-white/10">
                <p className="font-semibold text-base mb-1 text-white">{quantity}x {title}</p>
                {selectedSize && <p>Size: <span className="font-medium text-cyan-400">{selectedSize}</span></p>}
                {selectedColor && <p>Color: <span className="font-medium text-cyan-400">{selectedColor}</span></p>}
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-cyan-400">₹{price * quantity}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 border border-white/20 text-white/80 font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashOnDelivery}
                  className="flex-1 py-3 px-4 bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors"
                >
                  Confirm COD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl w-full"
        >
          {/* Main Grid */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">

            {/* LEFT: Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-[3/4] lg:aspect-[4/5] w-full bg-gray-900 overflow-hidden border border-white/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                    src={imageList[currentImageIndex]}
                    alt={`${title} - view ${currentImageIndex + 1}`}
                    onClick={() => setSelectedImage(imageList[currentImageIndex])}
                  />
                </AnimatePresence>

                {/* Image indicators */}
                {imageList.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {imageList.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-[2px] rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-6 bg-cyan-400' : 'w-3 bg-white/40'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {imageList.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imageList.map((imgSrc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-24 sm:w-24 sm:h-32 overflow-hidden border-2 transition-all duration-200
                         ${currentImageIndex === idx ? 'border-cyan-400' : 'border-white/20 hover:border-white/40'}
                       `}
                    >
                      <img src={imgSrc} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      {currentImageIndex !== idx && <div className="absolute inset-0 bg-black/50"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Details */}
            <div className="py-6 lg:py-0 flex flex-col">

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                  {brand || 'NEXT WARDROBE'}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold border border-cyan-500/50 text-cyan-400 uppercase tracking-wider">
                  In Stock
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                  {title}
                </p>

                <div className="flex flex-col gap-2">
                  {/* Cart Button */}
                  <button
                    onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                    disabled={cartLoading}
                    className={`flex-shrink-0 p-3 flex flex-col items-center justify-center transition-all border
                      ${isInCart
                        ? 'bg-white/10 border-white/20 text-cyan-400 hover:bg-white/20'
                        : 'bg-white/5 border-white/10 text-black hover:text-red-600 hover:bg-white/10'
                      }
                      ${cartLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {cartLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isInCart ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6.5M17 13l1.5 6.5M9 21h6M12 18v3" />
                        )}
                      </svg>
                    )}
                    <span className="text-[9px] font-bold mt-1 leading-none tracking-wider">
                      {isInCart ? 'REMOVE' : 'ADD TO CART'}
                    </span>
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={handleLikeToggle}
                    className={`flex-shrink-0 p-3 flex flex-col items-center justify-center transition-all border ${isLiked
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-black/50 hover:text-red-400 hover:border-red-500/30'
                      }`}
                  >
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'fill-current' : 'fill-none stroke-current stroke-[1.5]'}`}
                      viewBox="0 0 20 20"
                    >
                      {isLiked ? (
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      )}
                    </svg>
                    {likeCount > 0 && (
                      <span className="text-[9px] font-bold mt-0.5 leading-none">{likeCount}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Reviews Summary */}
              {!loadingReviews && reviewStats.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {renderStars(reviewStats.averageRating)}
                  <a href="#reviews" className="text-xs font-mono text-cyan-400 hover:underline tracking-wider">
                    {reviewStats.totalReviews} REVIEW{reviewStats.totalReviews !== 1 && 'S'}
                  </a>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 flex flex-col gap-1 mt-2">
                {discount && discount > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-white/40 line-through font-medium">
                        ₹{originalPrice}
                      </span>
                      <span className="bg-cyan-500/20 text-cyan-400 text-sm font-bold px-2 py-1 uppercase tracking-wider">
                        {discount}% OFF
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-white">₹{price}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">₹{price}</span>
                  </div>
                )}
                <p className="text-xs font-mono text-white/40 mt-1">Inclusive of all taxes</p>
              </div>

              <div className="h-px bg-white/10 w-full mb-6"></div>

              {/* Sizes */}
              {sizes && sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wide">Select Size</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 h-14 flex items-center justify-center border text-sm font-bold transition-all uppercase
                          ${selectedSize === size
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                            : 'border-black/20 text-black/60 hover:border-black/40 hover:text-black'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors && colors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wide mb-3">Select Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`px-5 py-2.5 border text-sm font-bold capitalize transition-all
                          ${selectedColor === color
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                            : 'border-black/20 text-black/60 hover:border-black/40 hover:text-black'
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
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wide mb-3">Product Details</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-mono">
                  {description}
                </p>
              </div>

              {/* Quantity & Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 bg-white/5 p-4 border border-white/10">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-wide">Quantity</label>
                  <div className="flex items-center border border-white/20 w-fit">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-3 text-black/40 hover:text-cyan-400 transition-colors disabled:opacity-30"
                      disabled={quantity <= 1 || loading || loadingCod}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-3 text-black/40 hover:text-cyan-400 transition-colors disabled:opacity-30"
                      disabled={quantity >= 10 || loading || loadingCod}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                    <span className="w-12 text-center font-bold text-white text-lg select-none">{quantity}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-white/40 mb-1 uppercase tracking-wide">Subtotal</p>
                  <p className="text-2xl font-black text-white">₹{price * quantity}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOnlinePayment}
                  disabled={loading || loadingCod}
                  className={`w-full py-4 text-base font-bold tracking-wider uppercase transition-all flex justify-center items-center gap-2
                    ${loading || loadingCod
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-cyan-400 hover:text-black'
                    }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                      </svg>
                      <span className=' text-green-400 font-bold'>Pay Online</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openConfirmation}
                  disabled={loading || loadingCod}
                  className={`w-full py-4 text-base font-bold tracking-wider uppercase transition-all 
                    ${loading || loadingCod
                      ? 'bg-cyan-500/20 text-cyan-400/50 cursor-not-allowed'
                      : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                    }`}
                >
                  {loadingCod || loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span>Cash on Delivery</span>
                  )}
                </motion.button>

                <button
                  className="w-full py-4 text-base font-bold tracking-wider uppercase transition-all bg-white/5 border border-white/20 text-black/70 hover:border-cyan-400 hover:text-cyan-400 flex justify-center items-center gap-2"
                  onClick={() => {
                    const phone = "7501294656";
                    const message = `i like the product ${title}. the price mention ${price}, have discount ${discount}, product quality ${description}. i want to talk with you about the product.`;
                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    window.location.href = url;
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.97.53 3.85 1.47 5.47L2 22l4.53-1.47A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.49 0-2.88-.4-4.07-1.09l-.29-.17-2.69.87.86-2.65-.18-.3A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M16.5 13.5c-.5-.2-1.2-.6-1.5-.8-.3-.2-.6-.2-.8.2-.2.4-.8 1-.9 1.2-.1.2-.3.2-.6 0-.9-.4-1.6-1-2.1-1.7-.2-.3-.2-.5 0-.7.2-.2.3-.4.5-.6.2-.2.3-.4.3-.7 0-.3-.2-.7-.4-1-.4-.5-.8-1.1-1.4-1.5-.3-.2-.6-.3-.9-.2-.3 0-.7.3-.9.6-.4.5-.6 1.1-.6 1.7 0 .6.1 1.2.4 1.8.3.6.8 1.2 1.3 1.7 1.2 1.1 2.7 1.8 4.3 2.2.5.1 1 .2 1.5.2.6 0 1.2-.1 1.7-.4.4-.2.7-.6.9-1 .2-.4.2-.8.1-1.2-.1-.1-.3-.2-.6-.3z"/>
                  </svg>
                  WhatsApp Supplier
                </button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div id="reviews" className="mt-20 border-t border-white/10 pt-12 pb-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-8">Customer Reviews</h2>

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white/5 p-8 text-center border border-white/10">
                <p className="text-gray-400 font-mono">No reviews yet for this product.</p>
                <p className="text-xs text-white/40 mt-1 font-mono">Be the first to order and review it!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review, idx) => (
                  <div key={idx} className="bg-white/5 p-6 border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white uppercase text-sm tracking-wider">{review.userName || 'Anonymous User'}</span>
                        <div className="mt-1">{renderStars(review.rating)}</div>
                      </div>
                      {review.createdAt && (
                        <span className="text-[10px] text-white/40 font-mono">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed font-mono">
                      {review.comment}
                    </p>
                    {review.reviewImages && review.reviewImages.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {review.reviewImages.map((img, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setSelectedImage(img)}
                            className="w-20 h-20 flex-shrink-0 border border-white/20 bg-black cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

export default Product;