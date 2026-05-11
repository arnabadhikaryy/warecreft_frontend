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

// --- NEW: Extracted Product Card Component ---
// This allows each card to manage its own 10-second image timer independently.
const ProductCard = ({ item, user, navigate, handleDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalize image array (fallback to pic_url or placeholder if missing)
  const imageList = item.images && item.images.length > 0 
    ? item.images 
    : (item.pic_url ? [item.pic_url] : ['https://via.placeholder.com/400x500?text=No+Image']);

  // Timer to change image every 10 seconds if multiple exist
  useEffect(() => {
    let timer;
    if (imageList.length > 1) {
      timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
      }, 5000); // 10000ms = 10 seconds
    }
    return () => clearInterval(timer);
  }, [imageList.length]);

  const hasDiscount = item.discount && item.discount > 0;
  const finalPrice = hasDiscount 
      ? Math.round(item.price - (item.price * (item.discount / 100))) 
      : item.price;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-gray-900/50 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col relative"
    >
      {/* Absolute Badges: Discount & Likes */}
      {hasDiscount && (
          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
              {item.discount}% OFF
          </div>
      )}
      <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-red-500 text-[10px] font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {item.likes || 0}
      </div>

      {/* Image Carousel */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex} // Triggers animation on change
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.5 }}
            src={imageList[currentImageIndex]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </AnimatePresence>
        
        {/* Indicators for multiple images */}
        {imageList.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {imageList.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-3 bg-white' : 'w-1 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Category & Type */}
        <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 line-clamp-1">
            {item.category || 'Apparel'} • {item.type || 'General'}
        </p>
        
        {/* Title */}
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white flex-grow line-clamp-2 leading-tight">
          {item.title}
        </h3>

        {/* Sizes Display */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-1">
            {item.sizes.map((size, idx) => (
              <span key={idx} className="text-[10px] border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
                {size}
              </span>
            ))}
          </div>
        )}
        
        {/* Price & Action */}
        <div className="mt-2 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                 <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    ₹{finalPrice}
                 </p>
                 <p className="text-xs sm:text-sm text-gray-400 line-through">
                   ₹{item.price}
                 </p>
              </div>
            ) : (
              <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                ₹{item.price}
              </p>
            )}
          </div>

          {item.inStock !== false ? (
            <button
              onClick={() => {
                navigate('/product', {
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
                    colors: item.colors
                  },
                });
              }}
              className="flex-1 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Buy Now
            </button>
          ) : (
            <span className='text-red-500 dark:text-red-400 text-xs sm:text-sm font-medium'> 
              Out of Stock
            </span>
          )}
        </div>

        {/* Admin Controls */}
        {user?.phone == adminphone && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigate('/editfood', { state: { productData: item } })}
              className="flex-1 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(item._id)}
              className="flex-1 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
// --- END Product Card Component ---


const ShopPage = () => { 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [user, setUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const banners = [
    "https://res.cloudinary.com/dr6u53c39/image/upload/WhatsApp_Image_2026-05-02_at_1.20.56_PM_utrgua.jpg",
  ];

  const popularCategories = [
    { name: "All", image: "https://cdn-icons-png.flaticon.com/512/8333/8333246.png" }, 
    { name: "Men", image: "https://static.thenounproject.com/png/860317-200.png" },
    { name: "Women", image: "https://img.freepik.com/premium-vector/woman-dress-icon-simple-illustration-woman-dress-vector-icon-web_96318-24869.jpg" },
    { name: "Kids", image: "https://cdn-icons-png.flaticon.com/512/2934/2934315.png" },
    { name: "Unisex", image: "https://cdn-icons-png.flaticon.com/512/4663/4663080.png" }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000); 
    return () => clearInterval(slideTimer);
  }, [banners.length]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${backend_Url}/production/getallfood`);
        if (response.data.status) {
          setProducts(response.data.message);
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
          setUser({
            name: decoded.name,
            phone: decoded.phone,
            img_url: decoded.img_url
          });
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

  const ProductSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="p-4 sm:p-5">
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full w-1/3 mb-2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-3/4 mb-4 animate-pulse"></div>
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded-xl w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const filteredItems = products.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search Bar */}
        <div className="mb-10 max-w-lg mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-full leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm shadow-inner transition-colors"
              placeholder="Search by title or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- Sliding Banner Section --- */}
        <div className="mb-12 relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-2xl shadow-lg">
          {banners.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Banner ${idx + 1}`}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'bg-white w-6' : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

                {/* --- Category Filters --- */}
        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {popularCategories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pr-6 rounded-xl shadow-sm border-2 min-w-max cursor-pointer transition-all duration-200
                  ${selectedCategory === cat.name 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-transparent hover:border-emerald-200 dark:border-gray-700'
                  }`}
              >
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-14 h-14 rounded-lg object-contain bg-gray-50 dark:bg-gray-700" 
                />
                <span className={`font-bold text-lg ${
                    selectedCategory === cat.name 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : 'text-gray-800 dark:text-gray-200'
                  }`}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid / Loading / Error */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/30">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Oops!</h3>
            <p className="mt-2 text-red-600 dark:text-red-300">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No items found</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                {selectedCategory !== 'All' 
                  ? `There are currently no products in the "${selectedCategory}" category.` 
                  : 'Try a different search term.'}
            </p>
            {selectedCategory !== 'All' && (
               <button 
                 onClick={() => setSelectedCategory('All')}
                 className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
               >
                 View All Products
               </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5" 
          >
            {/* Render the extracted ProductCard component */}
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