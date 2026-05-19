import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from './futer';
import Navbar from './navbar';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("3 - 5");
  
  useEffect(() => {
    // Generate a more realistic order ID for clothing brand
    const prefix = "NW";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    setOrderId(`${prefix}-${timestamp}-${random}`);
    
    // Randomize estimated delivery days based on location simulation
    const days = ["3 - 5", "4 - 6", "2 - 4", "5 - 7"];
    const randomDays = days[Math.floor(Math.random() * days.length)];
    setEstimatedDays(randomDays);
  }, []);

  return (
    <div className="h-full w-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          {/* Main Success Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* Hero Section with Celebration Animation */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-8 sm:p-10 text-center overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full filter blur-2xl"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full filter blur-2xl"></div>
              </div>
              
              {/* Animated Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2 
                }}
                className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"
              >
                <motion.svg 
                  className="w-12 h-12 text-emerald-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="3" 
                    d="M5 13l4 4L19 7"
                    strokeDasharray="0 1"
                    strokeDashoffset="0"
                  />
                </motion.svg>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-3"
              >
                Order Confirmed! 🎉
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-emerald-100 text-base sm:text-lg"
              >
                Thank you for shopping with nextWardrobe
              </motion.p>
            </div>

            {/* Order Details Section */}
            <div className="p-6 sm:p-8">
              {/* Order ID Card */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Order ID</p>
                    <p className="text-gray-900 font-mono font-bold text-lg tracking-wide">
                      {orderId}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-gray-500 text-sm font-medium mb-1">Estimated Delivery</p>
                    <p className="text-emerald-600 font-bold text-lg">
                      {estimatedDays} business days
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Delivery Info */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Order Update Sent!</p>
                    <p className="text-sm text-gray-600">
                      We've sent a confirmation email with your order details and tracking information.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* What's Next Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What's Next?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-emerald-600 font-bold">1</span>
                    </div>
                    <p className="text-sm text-gray-700">Order Processing</p>
                    <p className="text-xs text-gray-500 mt-1">We're preparing your items</p>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-emerald-600 font-bold">2</span>
                    </div>
                    <p className="text-sm text-gray-700">Quality Check</p>
                    <p className="text-xs text-gray-500 mt-1">Inspecting your products</p>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-emerald-600 font-bold">3</span>
                    </div>
                    <p className="text-sm text-gray-700">On Your Way</p>
                    <p className="text-xs text-gray-500 mt-1">Shipped to your address</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-3"
              >
                
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600"
                >
                  Continue Shopping
                </button>
              </motion.div>

              {/* Social Share Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 pt-6 border-t border-gray-200 text-center"
              >
                <p className="text-xs text-gray-500 mb-3">Share your style with friends</p>
                <div className="flex justify-center gap-3">
                  <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.892h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </button>
                  <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.913-12.105c0-.21-.005-.424-.015-.636A10.024 10.024 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.689.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Brand Footer Note */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center text-xs text-gray-400 mt-6"
          >
            © 2024 nextWardrobe | Style That Speaks Volumes
          </motion.p>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderSuccess;