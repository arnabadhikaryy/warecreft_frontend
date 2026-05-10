import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { getCookie } from '../middelwaie/cookie'; 
import Footer from './futer'; 
import Navbar from './navbar';
import backend_Url from '../backend_url_return_function/backendUrl';

const AddFoodPage = () => {
  const navigate = useNavigate();
  
  // 1. Core Form Data State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discount: '0',
    brand: '',
    category: '',
    type: '',
    colors: ''
  });
  
  const [selectedSizes, setSelectedSizes] = useState([]);
  
  // 2. Multiple File State for Upload & Preview
  const [imageFiles, setImageFiles] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [useradminpassword, setUseradminpassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const adminpassword = '55555@arnab';

  const categories = ['Men', 'Women', 'Kids', 'Unisex'];
  const types = ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Jackets', 'Accessories'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // 3. FIXED: Logic to append new images to existing ones
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Combine existing files with the newly selected files
    const combinedFiles = [...imageFiles, ...newFiles];
    
    if (combinedFiles.length > 5) {
      toast.error('You can only upload a maximum of 5 images');
      return;
    }

    if (newFiles.length > 0) {
      setImageFiles(combinedFiles);
      
      // Clear old previews from memory before creating new ones
      previews.forEach(url => URL.revokeObjectURL(url));
      
      // Create previews for all combined files
      const newPreviews = combinedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  // NEW: Function to remove a specific image from the selection
  const removeImage = (indexToRemove) => {
    const updatedFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
    
    // Revoke the URL for the removed image to free memory
    URL.revokeObjectURL(previews[indexToRemove]);
    
    setImageFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title || !formData.price || !formData.category || !formData.type) {
      toast.error('Missing required fields: Title, Price, Category, and Type');
      setLoading(false);
      return;
    }

    if (imageFiles.length === 0) {
      toast.error('Please upload at least one image');
      setLoading(false);
      return;
    }

    try {
      const token = getCookie('authToken');
      if (!token) {
        toast.error('Authorization required');
        navigate('/login');
        return;
      }

      if (useradminpassword !== adminpassword) {
        toast.error('Invalid Authorization Key');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      formDataToSend.append('sizes', selectedSizes.join(','));

      imageFiles.forEach((file) => {
        formDataToSend.append('pic_url_file', file);
      });

      const response = await axios.post(
        `${backend_Url}/production/addfood`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status) {
        toast.success('Item listed successfully!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        toast.error(response.data.message || 'Listing failed');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'An error occurred');
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen bg-gray-50 flex flex-col font-sans min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar/>
      
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-emerald-600 px-8 py-6 relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold text-white tracking-tight">Add Apparel</h1>
                <p className="text-emerald-100 mt-1 text-sm">List a new clothing item</p>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 5. Multiple Image Upload & Preview Grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Images ({imageFiles.length}/5)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden" 
                      id="image-upload"
                      disabled={imageFiles.length >= 5}
                    />
                    
                    {previews.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full">
                          {previews.map((src, index) => (
                            <div key={index} className="aspect-[3/4] relative rounded-lg overflow-hidden shadow-sm border border-gray-200 group">
                               <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                               {/* Remove Image Button */}
                               <button
                                 type="button"
                                 onClick={() => removeImage(index)}
                                 className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                               </button>
                            </div>
                          ))}
                          
                          {/* Add more images button (shows if under 5 limit) */}
                          {imageFiles.length < 5 && (
                            <label htmlFor="image-upload" className="aspect-[3/4] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-xs text-gray-500 mt-2">Add More</span>
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label 
                        htmlFor="image-upload"
                        className="relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer p-4"
                      >
                        <div className="text-center p-4">
                          <div className="mx-auto h-12 w-12 text-gray-400 mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Click to select images</p>
                          <p className="text-xs text-gray-400 mt-1">Accepts up to 5 images (PNG, JPG)</p>
                        </div>
                      </label>
                    )}
                  </div>
                </motion.div>

                {/* Basic Details */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Item Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Classic Denim Jacket" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Levi's, H&M" />
                  </div>
                </div>

                {/* Price and Categorization */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="">Select Type</option>
                      {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Sizes Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Sizes</label>
                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                          ${selectedSizes.includes(size) 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                        <input type="number" name="discount" value={formData.discount} onChange={handleChange} min="0" max="100" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="10" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Colors (Comma separated)</label>
                        <input type="text" name="colors" value={formData.colors} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Red, Blue, Black" />
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="Enter product description, fit, material details..."></textarea>
                </div>

                {/* Authorization */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <label htmlFor="adminpassword" className="block text-sm font-semibold text-gray-700 mb-2">Key</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="adminpassword"
                      name="adminpassword"
                      value={useradminpassword}
                      onChange={(e) => setUseradminpassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Enter Key"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all
                    ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30'}`}
                >
                  {loading ? "Processing..." : "Publish Product"}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer/>
    </div>
  );
};

export default AddFoodPage;