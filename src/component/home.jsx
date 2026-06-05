import React, { useState, useEffect } from 'react';
import Footer from './futer';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import Navbar from "./navbar";
import { getCookie } from '../middelwaie/cookie';
import { jwtDecode } from 'jwt-decode';
import { adminphone, backend_Url } from '../backend_url_return_function/backendUrl';

// --- Premium Product Card Component (Urban Drop Style) ---
const ProductCard = ({ item, user, navigate, handleDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const imageList = item.images?.length > 0
    ? item.images
    : (item.pic_url ? [item.pic_url] : ['https://placehold.co/600x800?text=URBAN+DROP']);

  useEffect(() => {
    let timer;
    if (imageList.length > 1) {
      timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [imageList.length]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    const token = getCookie('authToken');
    if (!token) {
      toast.error("Please log in to like products!");
      return;
    }

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const response = await axios.post(`${backend_Url}/production/toggleLikeProduct`, {
        productId: item._id,
        token: token
      });
      if (!response.data.success) {
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

  const hasDiscount = item.discount && item.discount > 0;
  const finalPrice = hasDiscount
    ? Math.round(item.price - (item.price * (item.discount / 100)))
    : item.price;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative bg-black/40 backdrop-blur-sm rounded-none overflow-hidden transition-all duration-500 hover:bg-black/60"
    >
      {/* Image Container with Overlay */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-900 relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 1.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={imageList[currentImageIndex]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </AnimatePresence>

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Like Button - Minimalist */}
     

        {/* Discount Badge - Neon Style */}
        {hasDiscount && (
          <div className="absolute top-4 left-4 z-10 bg-cyan-500 text-black text-xs font-bold px-3 py-1 tracking-wider">
            {item.discount}% OFF
          </div>
        )}

        {/* Image Indicators - Minimal Dots */}
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

      {/* Product Info */}
      <div className="p-4 flex flex-col">
        {/* Brand / Category */}
        <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
          {item.category || 'APPAREL'} / {item.type || 'ESSENTIALS'}
        </p>

        {/* Title */}
        <h3 className="text-sm font-bold text-white uppercase tracking-tight leading-tight mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Sizes - Minimalist Chip Design */}
        {item.sizes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
            {item.sizes.slice(0, 4).map((size, idx) => (
              <span key={idx} className="text-[9px] font-mono border border-white/20 rounded px-2 py-0.5 text-white/60">
                {size}
              </span>
            ))}
            {item.sizes.length > 4 && (
              <span className="text-[9px] font-mono text-white/40">+{item.sizes.length - 4}</span>
            )}
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">₹{finalPrice}</span>
                <span className="text-xs text-white/40 line-through">₹{item.price}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-white">₹{item.price}</span>
            )}
          </div>

          {item.inStock !== false ? (
            <button
              onClick={() => navigate('/product', {
                state: {
                  id: item._id,
                  images: item.images || [item.pic_url],
                  title: item.title,
                  originalPrice: item.price,
                  price: finalPrice,
                  discount: item.discount,
                  description: item.description,
                  brand: item.brand,
                  sizes: item.sizes,
                  colors: item.colors,
                  likes: item.likes
                },
              })}
              className="px-4 py-1.5 bg-white text-black text-xs font-bold tracking-wider hover:bg-cyan-400 hover:text-black transition-all duration-300"
            >
              SHOP NOW
            </button>
          ) : (
            <span className='text-red-400 text-xs font-mono'>SOLD OUT</span>
          )}
        </div>

        {/* Admin Controls */}
        {user?.phone === adminphone && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => navigate('/editfood', { state: { productData: item } })}
              className="flex-1 py-1.5 bg-white/10 text-green-500 text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              EDIT
            </button>
            <button
              onClick={() => handleDelete(item._id)}
              className="flex-1 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
            >
              DELETE
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Categories with counts
  const [categories, setCategories] = useState([
    { name: "All", count: 0, image: null },
    { name: "Men", count: 0, image: null },
    { name: "Unisex", count: 0, image: null }
  ]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${backend_Url}/production/getallfood`);
        if (response.data.status) {
          const productList = [...response.data.message].reverse();
          setProducts(productList);

          // Update category counts
          const menCount = productList.filter(p => p.category === "Men").length;
          const unisexCount = productList.filter(p => p.category === "Unisex").length;
          setCategories([
            { name: "All", count: productList.length, image: null },
            { name: "Men", count: menCount, image: null },
            { name: "Unisex", count: unisexCount, image: null }
          ]);
        } else {
          throw new Error('Failed to fetch products');
        }
      } catch (err) {
        toast.error('Failed to load products');
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie('authToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUser({ name: decoded.name, phone: decoded.phone, img_url: decoded.img_url });
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    };
    checkAuth();
  }, []);

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this product?");
    if (!isConfirmed) return;

    const token = getCookie('authToken');
    if (!token) {
      toast.error("Authentication token not found. Please log in.");
      return;
    }

    try {
      const response = await axios.delete(`${backend_Url}/production/delete/product`, {
        data: { token: token, _id: id }
      });
      if (response.status === 200) {
        toast.success("Product deleted successfully!");
        setProducts(prevItems => prevItems.filter(item => item._id !== id));
      } else {
        toast.error("Failed to delete the product.");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.response?.data?.message || "An error occurred while deleting.");
    }
  };

  const filteredItems = products.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Skeleton Loader
  const ProductSkeleton = () => (
    <div className="bg-black/40 animate-pulse">
      <div className="aspect-[3/4] bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-2 bg-gray-700 w-1/3" />
        <div className="h-4 bg-gray-700 w-3/4" />
        <div className="h-3 bg-gray-700 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-700 w-1/4" />
          <div className="h-8 bg-gray-700 w-20" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-screen bg-black text-white">
      <Navbar />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' }
      }} />

      {/* Hero Section - Minimalist with diagonal pattern */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border-b border-white/10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,255,0.05)_50%,transparent_75%)] bg-[length:4rem_4rem]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
              NEXT WARDROBE
            </h1>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto font-mono text-sm">
              Premium streetwear essentials. Built for the bold.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar - Minimalist */}
        <div className="mb-12 max-w-md mx-auto">
          <div className="relative group">
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-none px-5 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 focus:bg-black transition-all duration-300 font-mono text-sm"
              placeholder="SEARCH PRODUCTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filters - Pill Style with Counters */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-6 py-2.5 text-sm font-mono font-bold tracking-wider transition-all duration-300 ${selectedCategory === cat.name
                    ? 'bg-cyan-500 text-black border-cyan-500'
                    : 'bg-transparent text-gray-400 border-white/20 hover:border-cyan-500/50 hover:text-white'
                  } border`}
              >
                {cat.name} <span className="ml-2 text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex justify-between items-center border-b border-white/10 pb-4">
          <p className="text-xs font-mono text-gray-500 tracking-wider">
            {filteredItems.length} PRODUCTS FOUND
          </p>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              CLEAR FILTERS
            </button>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-red-500/30 bg-red-500/5">
            <p className="text-red-400 font-mono">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              RETRY
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-white/10">
            <h3 className="text-xl font-bold uppercase tracking-wider">No products found</h3>
            <p className="mt-2 text-gray-500 font-mono text-sm">
              {selectedCategory !== 'All'
                ? `No items in "${selectedCategory}" category`
                : 'Try adjusting your search'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          >
            {filteredItems.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                user={user}
                navigate={navigate}
                handleDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ShopPage;