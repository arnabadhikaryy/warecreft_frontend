import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCookie } from '../middelwaie/cookie';
import backend_Url from '../backend_url_return_function/backendUrl';
import Navbar from './navbar'; // Assuming you want Navbar here too
import Footer from './futer';

const EditFoodItem = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the ID passed via React Router state
    // We also support receiving full productData directly if passed from the shop page
    const foodId = location.state?.id || location.state?.productData?._id;

    // Expanded state for clothing schema
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        discount: 0,
        inStock: true, // Changed from availability
        description: '',
        brand: '',
        category: '',
        type: '',
        colors: '' // Stored as comma-separated string for the input field
    });

    const [selectedSizes, setSelectedSizes] = useState([]);
    
    // Image handling states
    const [existingImages, setExistingImages] = useState([]); // Images already in DB
    const [imageFiles, setImageFiles] = useState([]); // New files selected by user
    const [newPreviews, setNewPreviews] = useState([]); // Previews for new files

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dropdown constants
    const categories = ['Men', 'Women', 'Kids', 'Unisex'];
    const types = ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Jackets', 'Accessories'];
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [newPreviews]);

    // 1. Fetch the single product details on component mount
    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!foodId) {
                setError("No product ID provided.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${backend_Url}/production/singleFoodDetails`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ _id: foodId }),
                });

                const result = await response.json();

                if (result.success) {
                    const data = result.data;
                    setFormData({
                        title: data.title || '',
                        price: data.price || '',
                        discount: data.discount || 0,
                        inStock: data.inStock !== undefined ? data.inStock : (data.availability !== undefined ? data.availability : true),
                        description: data.description || '',
                        brand: data.brand || '',
                        category: data.category || '',
                        type: data.type || '',
                        colors: data.colors ? data.colors.join(', ') : ''
                    });
                    
                    setSelectedSizes(data.sizes || []);
                    
                    // Handle image arrays or fallback to old pic_url
                    if (data.images && data.images.length > 0) {
                        setExistingImages(data.images);
                    } else if (data.pic_url) {
                        setExistingImages([data.pic_url]);
                    }
                } else {
                    setError(result.message || "Failed to fetch product details.");
                }
            } catch (err) {
                setError("An error occurred while fetching data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        // If we passed the full object via location.state, we can use it immediately! 
        // Otherwise, fetch it.
        if (location.state?.productData) {
            const data = location.state.productData;
            setFormData({
                title: data.title || '',
                price: data.price || '',
                discount: data.discount || 0,
                inStock: data.inStock !== undefined ? data.inStock : (data.availability !== undefined ? data.availability : true),
                description: data.description || '',
                brand: data.brand || '',
                category: data.category || '',
                type: data.type || '',
                colors: data.colors ? data.colors.join(', ') : ''
            });
            setSelectedSizes(data.sizes || []);
            setExistingImages(data.images && data.images.length > 0 ? data.images : (data.pic_url ? [data.pic_url] : []));
            setLoading(false);
        } else {
            fetchProductDetails();
        }
    }, [foodId, location.state]);

    // 2. Handle text/number inputs
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSizeToggle = (size) => {
        setSelectedSizes(prev => 
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    // 3. Handle multiple file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 5) {
            alert('You can only upload up to 5 images');
            return;
        }

        if (files.length > 0) {
            setImageFiles(files);
            const previews = files.map(file => URL.createObjectURL(file));
            setNewPreviews(previews);
        } else {
            setImageFiles([]);
            setNewPreviews([]);
        }
    };

    // 4. Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getCookie('authToken');
            const submitData = new FormData();

            // Append standard fields
            submitData.append('_id', foodId);
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            
            // Append sizes array
            submitData.append('sizes', selectedSizes.join(','));

            if (token) {
                submitData.append('token', token);
            }

            // Append new files if selected
            // NOTE: Key must match backend upload.array('pic_url_file', 5)
            if (imageFiles.length > 0) {
                imageFiles.forEach(file => {
                    submitData.append('pic_url_file', file);
                });
            }

            const response = await fetch(`${backend_Url}/production/edit/product`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: submitData
            });

            const result = await response.json();

            if (result.success) {
                alert("Product updated successfully!");
                navigate('/'); 
            } else {
                setError(result.message || "Failed to update product.");
            }
        } catch (err) {
            setError("An error occurred while updating.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen w-screen flex flex-col bg-gray-50">
            <Navbar />
            
            <div className="flex-grow flex items-center justify-center p-4 py-10">
                <div className="w-full max-w-3xl p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h2>
                    <p className="text-gray-500 mb-8">Update details for your clothing item.</p>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                                <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                                <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} min="0" max="100" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                        </div>

                        {/* Category & Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">Select Category</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                                <select name="type" value={formData.type} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">Select Type</option>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Sizes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Available Sizes</label>
                            <div className="flex flex-wrap gap-2">
                                {availableSizes.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleSizeToggle(size)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                                            selectedSizes.includes(size) 
                                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors & Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Colors (Comma separated)</label>
                            <input type="text" name="colors" value={formData.colors} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Red, Blue, Black" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="3" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                        </div>

                        {/* Stock Checkbox */}
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <input type="checkbox" name="inStock" id="inStock-toggle" checked={formData.inStock} onChange={handleInputChange} className="w-5 h-5 text-emerald-600 rounded cursor-pointer" />
                            <label htmlFor="inStock-toggle" className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer">
                                Product is In Stock
                            </label>
                        </div>

                        {/* Image Upload */}
                        <div className="border-t border-gray-200 pt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Replace Images (Up to 5)</label>
                            <p className="text-xs text-gray-500 mb-3">Selecting new images will overwrite the current ones.</p>
                            
                            <input 
                                type="file" 
                                name="pic_url_file" 
                                accept="image/*" 
                                multiple
                                onChange={handleFileChange} 
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer transition-all"
                            />
                            
                            {/* Display New Previews OR Existing Images */}
                            <div className="mt-4">
                                {newPreviews.length > 0 ? (
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">New Images to Upload:</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {newPreviews.map((src, i) => (
                                                <img key={i} src={src} alt="New Preview" className="w-20 h-24 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                                            ))}
                                        </div>
                                    </div>
                                ) : existingImages.length > 0 ? (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Current Images:</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {existingImages.map((src, i) => (
                                                <img key={i} src={src} alt="Current Product" className="w-20 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`mt-4 w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${
                                loading 
                                ? "bg-emerald-400 cursor-not-allowed" 
                                : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-[0.98]"
                            }`}
                        >
                            {loading ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default EditFoodItem;