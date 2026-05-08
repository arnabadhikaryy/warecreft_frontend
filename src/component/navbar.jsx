import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '../middelwaie/cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { adminphone } from '../backend_url_return_function/backendUrl';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

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
    // Optional: Add event listener for token changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    // Clear the auth token cookie
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Left side - Logo/Brand */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dr6u53c39/image/upload/WhatsApp_Image_2026-05-02_at_12.21.08_PM_u33xj9.jpg"
              alt="Logo"
              className="w-12 h-12  object-cover border-2 border-emerald-500"
            />
            <Link to="/" className="flex items-center gap-2 text-2xl font-serif italic text-gray-900 dark:text-white hover:text-emerald-600 transition-colors">
              Wear<span className="not-italic font-bold border-b-2 border-emerald-500">Craft</span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 space-x-6 lg:space-x-8">
            <NavLink to="/" text="Home" />

            {user && (
              <>
                <NavLink to="/profile" text="Account" />
                <NavLink to="/orderhistory" text="Your Orders" />
                <NavLink to="/profile/edit" text="Edit Profile" />
              </>
            )}

            {/* Admin Links - Grouped with a subtle left border */}
            {user?.phone === adminphone && (
              <div className="flex items-center gap-6 pl-6 lg:pl-8 border-l border-gray-200 dark:border-gray-700">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hidden lg:block">
                  Admin
                </span>
                <NavLink to="/addfood" text="Add Product" />
                <NavLink to="/allusersorders" text="All Orders" />
              </div>
            )}
          </div>

          {/* Right side - Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4 ml-3">
                {/* User Indicator / Simple Profile Button */}
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full transition-colors duration-300">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                  <span>{user?.name?.split(' ')[0] || 'User'}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 inline-flex items-center px-6 py-2 border-2 border-emerald-600 dark:border-emerald-500 text-sm font-bold tracking-wide rounded-none text-emerald-600 dark:text-emerald-500 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300"
              >
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              aria-expanded={dropdownOpen}
            >
              <span className="sr-only">Open main menu</span>
              {dropdownOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="pt-2 pb-4 space-y-1 px-2 sm:px-3">
              <MobileNavLink to="/" text="Home" onClick={() => setDropdownOpen(false)} />

              {user && (
                <>
                  <MobileNavLink to="/profile" text="Your Profile" onClick={() => setDropdownOpen(false)} />
                  <MobileNavLink to="/profile/edit" text="Edit Profile" onClick={() => setDropdownOpen(false)} />
                  <MobileNavLink to="/orderhistory" text="Your Orders" onClick={() => setDropdownOpen(false)} />

                  {/* Added missing Admin Links to mobile */}
                  {user?.phone == adminphone && (
                    <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2">
                      <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Admin</p>
                      <MobileNavLink to="/addfood" text="Add Food" onClick={() => setDropdownOpen(false)} />
                      <MobileNavLink to="/allusersorders" text="All Users Orders" onClick={() => setDropdownOpen(false)} />
                    </div>
                  )}
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Reusable NavLink component for desktop
const NavLink = ({ to, text }) => (
  <Link
    to={to}
    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
  >
    {text}
  </Link>
);

// Reusable NavLink component for mobile
const MobileNavLink = ({ to, text, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block pl-3 pr-4 py-2 border-l-4 border-emerald-500 dark:border-emerald-400 text-base font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 transition-colors"
  >
    {text}
  </Link>
);

export default Navbar;