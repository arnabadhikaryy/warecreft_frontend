
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
        {
            token: userToken
        },
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
        { productId: productId,
            token: userToken
         },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message.includes("successfully")) {
        toast.success("Item removed from cart");
        // Remove the item from state
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
    // Navigate to checkout page with all items
    navigate('/checkout', {
      state: {
        items: cartItems,
        totalAmount: getTotalPrice()
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <Toaster position="top-right" />
      
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6.5M17 13l1.5 6.5M9 21h6M12 18v3" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items - Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const finalPrice = calculateFinalPrice(item.product.price, item.product.discount);
                const hasDiscount = item.product.discount && item.product.discount > 0;
                const firstImage = item.product.images?.[0] || 'https://via.placeholder.com/200x200?text=No+Image';
                
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="sm:w-32 sm:h-32 flex-shrink-0">
                        <img
                          src={firstImage}
                          alt={item.product.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {item.product.title}
                            </h3>
                            {item.product.brand && (
                              <p className="text-sm text-gray-500 mb-2">{item.product.brand}</p>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              {hasDiscount ? (
                                <>
                                  <span className="text-2xl font-bold text-emerald-600">
                                    ₹{finalPrice}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{item.product.price}
                                  </span>
                                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                    {item.product.discount}% OFF
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl font-bold text-gray-900">
                                  ₹{item.product.price}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBuyNow(item)}
                              className="px-4 py-2 bg-emerald-600 text-blue-800 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
                            >
                              Buy Item
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.product._id, item._id)}
                              disabled={removingItemId === item._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {removingItemId === item._id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Product Specs */}
                        {(item.product.sizes?.length > 0 || item.product.colors?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-600">
                            {item.product.sizes?.length > 0 && (
                              <div>
                                <span className="font-semibold">Sizes:</span>{' '}
                                {item.product.sizes.join(', ')}
                              </div>
                            )}
                            {item.product.colors?.length > 0 && (
                              <div>
                                <span className="font-semibold">Colors:</span>{' '}
                                {item.product.colors.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Order Summary - Right Column */}
            <div className="lg:col-span-1 mt-6 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₹{getOriginalTotalPrice()}</span>
                  </div>
                  
                  {getTotalDiscount() > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{getTotalDiscount()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 pb-6 border-b border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-emerald-600">₹{getTotalPrice()}</span>
                </div>
                
                <div className="mt-6 space-y-3">
                  {/* <button
                    onClick={handleBuyAll}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Proceed to Buy All
                  </button> */}
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Payment</span>
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