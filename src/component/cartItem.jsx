import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../middelwaie/cookie';
import { jwtDecode } from 'jwt-decode';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './futer';
import Navbar from './navbar';
import backend_Url from '../backend_url_return_function/backendUrl';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState('');
  const [removingItemId, setRemovingItemId] = useState(null);

  useEffect(() => {
    const token = getCookie('authToken');
    if (token) {
      try {
        setUserToken(token);
        const decoded = jwtDecode(token);
        if (!decoded.phone) {
          toast.error('Session invalid. Please login again.');
          navigate('/login');
        }
      } catch (error) {
        console.error("Token decode error:", error);
        navigate('/login');
      }
    } else {
      toast.error('Please login to view your cart');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (userToken) {
      fetchCartItems();
    }
  }, [userToken]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${backend_Url}/user/get/cart`,
        { token: userToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message === "Cart fetched successfully.") {
        setCartItems(response.data.cart || []);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId, cartItemId) => {
    setRemovingItemId(cartItemId);
    try {
      const response = await axios.post(
        `${backend_Url}/user/remove/cart`,
        { productId: productId, token: userToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message.includes("successfully")) {
        toast.success("Item removed from cart");
        setCartItems(prevItems => prevItems.filter(item => item._id !== cartItemId));
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setRemovingItemId(null);
    }
  };

  const calculateFinalPrice = (price, discount) => {
    if (discount && discount > 0) {
      return Math.round(price - (price * discount / 100));
    }
    return price;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const finalPrice = calculateFinalPrice(item.product.price, item.product.discount);
      return total + finalPrice;
    }, 0);
  };

  const getOriginalTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.product.price, 0);
  };

  const getTotalDiscount = () => {
    return getOriginalTotalPrice() - getTotalPrice();
  };

  const handleBuyNow = (item) => {
    const finalPrice = calculateFinalPrice(item.product.price, item.product.discount);
    navigate('/product', {
      state: {
        id: item.product._id,
        images: item.product.images || [item.product.pic_url],
        title: item.product.title,
        originalPrice: item.product.price,
        price: finalPrice,
        discount: item.product.discount,
        description: item.product.description,
        brand: item.product.brand,
        sizes: item.product.sizes,
        colors: item.product.colors,
        likes: item.product.likes || 0
      },
    });
  };

  const handleBuyAll = () => {
    navigate('/checkout', {
      state: {
        items: cartItems,
        totalAmount: getTotalPrice()
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-full w-screen bg-black text-white">
      <Navbar />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' }
      }} />
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-cyan-400 mb-2">
            SHOPPING CART
          </h1>
          <div className="h-px w-20 bg-cyan-400"></div>
        </div>
        
        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-white/5 p-12 text-center"
          >
            <svg className="w-24 h-24 mx-auto text-white/20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6.5M17 13l1.5 6.5M9 21h6M12 18v3" />
            </svg>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-white/60 mb-2">YOUR CART IS EMPTY</h2>
            <p className="text-white/40 font-mono text-sm mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-8 py-3 border border-cyan-400 text-cyan-400 text-sm font-bold tracking-wider uppercase hover:bg-cyan-400 hover:text-black transition-all duration-300"
            >
              Continue Shopping
            </button>
          </motion.div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 pb-4 border-b border-white/10 mb-4 text-xs font-mono font-bold text-white/40 uppercase tracking-wider">
                <div className="col-span-6">PRODUCT</div>
                <div className="col-span-2 text-center">PRICE</div>
                <div className="col-span-2 text-center">DISCOUNT</div>
                <div className="col-span-2 text-right">ACTION</div>
              </div>
              
              <AnimatePresence>
                {cartItems.map((item) => {
                  const finalPrice = calculateFinalPrice(item.product.price, item.product.discount);
                  const hasDiscount = item.product.discount && item.product.discount > 0;
                  const firstImage = item.product.images?.[0] || 'https://placehold.co/200x200?text=URBAN+DROP';
                  
                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="p-4 lg:p-6">
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
                          {/* Product Image */}
                          <div className="lg:col-span-2">
                            <div className="aspect-square w-24 lg:w-full bg-black overflow-hidden border border-white/10">
                              <img
                                src={firstImage}
                                alt={item.product.title}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-grow lg:col-span-4">
                            <h3 className="text-base lg:text-lg font-bold uppercase tracking-tighter text-white mb-1">
                              {item.product.title}
                            </h3>
                            {item.product.brand && (
                              <p className="text-xs font-mono text-cyan-400 mb-2 tracking-wider">
                                {item.product.brand.toUpperCase()}
                              </p>
                            )}
                            {(item.product.sizes?.length > 0 || item.product.colors?.length > 0) && (
                              <div className="flex flex-wrap gap-3 text-[10px] font-mono text-white/40 mt-2">
                                {item.product.sizes?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-white/60">SIZE:</span>
                                    <span>{item.product.sizes.join(', ')}</span>
                                  </div>
                                )}
                                {item.product.colors?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-white/60">COLOR:</span>
                                    <span>{item.product.colors.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Price */}
                          <div className="lg:col-span-2 text-left lg:text-center">
                            {hasDiscount ? (
                              <div>
                                <span className="text-lg font-bold text-cyan-400">
                                  ₹{finalPrice}
                                </span>
                                <span className="text-xs text-white/40 line-through block">
                                  ₹{item.product.price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-white">
                                ₹{item.product.price}
                              </span>
                            )}
                          </div>
                          
                          {/* Discount */}
                          <div className="lg:col-span-2 text-left lg:text-center">
                            {hasDiscount ? (
                              <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wider">
                                -{item.product.discount}%
                              </span>
                            ) : (
                              <span className="text-white/20 text-xs">—</span>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2 justify-end lg:justify-center">
                            <button
                              onClick={() => handleBuyNow(item)}
                              className="px-3 lg:px-4 py-1.5 lg:py-2 border border-white/20 text-black/80 text-xs font-bold tracking-wider uppercase hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.product._id, item._id)}
                              disabled={removingItemId === item._id}
                              className="px-3 lg:px-4 py-1.5 lg:py-2 border border-red-500/30 text-red-400 text-xs font-bold tracking-wider uppercase hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
                            >
                              {removingItemId === item._id ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                'Remove'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="sticky top-24 border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold uppercase tracking-tighter text-white mb-6">
                  ORDER SUMMARY
                </h2>
                
                <div className="space-y-3 pb-4 border-b border-white/10">
                  <div className="flex justify-between text-sm font-mono text-white/60">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₹{getOriginalTotalPrice()}</span>
                  </div>
                  
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between text-sm font-mono text-cyan-400">
                      <span>Discount</span>
                      <span>-₹{getTotalDiscount()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm font-mono text-white/60">
                    <span>Shipping</span>
                    <span className="text-cyan-400">FREE</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 pb-6 border-b border-white/10">
                  <span className="text-base font-bold uppercase tracking-wider text-white">Total</span>
                  <span className="text-2xl font-black text-cyan-400">₹{getTotalPrice()}</span>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleBuyAll}
                    className="w-full py-3 bg-cyan-500 text-black text-sm font-bold tracking-wider uppercase hover:bg-cyan-400 transition-all duration-300"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 border border-white/20 text-black text-sm font-bold tracking-wider uppercase hover:border-b-gray-900 hover:text-blue-950 transition-all duration-300"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>SECURE PAYMENT • SSL ENCRYPTED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default Cart;