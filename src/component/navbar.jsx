import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getCookie } from '../middelwaie/cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { adminphone } from '../backend_url_return_function/backendUrl';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    window.addEventListener('storage', checkAuth);
    
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-black/95 backdrop-blur-md border-b border-black/10 shadow-2xl' 
        : 'bg-black/80 backdrop-blur-sm border-b border-black/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">

          {/* Left side - Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dr6u53c39/image/upload/v1779084676/file_000000009cc47207ac5fe9f053f59bde_bfhh1z.png"
                alt="Logo"
                className="w-10 h-10 lg:w-12 lg:h-12 object-cover"
              />
              <div className="absolute -inset-0.5 bg-cyan-500 blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </div>
            <Link to="/" className="group flex items-center gap-1">
              <span className="text-xl lg:text-2xl font-black uppercase tracking-tighter text-white">
                NEXT
              </span>
              <span className="text-xl lg:text-2xl font-black uppercase tracking-tighter text-cyan-400">
                WARDROBE
              </span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <NavLink to="/" text="HOME" />
            
            {user && (
              <>
                <NavLink to="/profile" text="ACCOUNT" />
                <NavLink to="/cart" text="CART" />
                <NavLink to="/orderhistory" text="ORDERS" />
                <NavLink to="/profile/edit" text="EDIT" />
              </>
            )}

            {/* Admin Links */}
            {user?.phone === adminphone && (
              <>
                <div className="w-px h-5 bg-white/20 mx-2"></div>
                <NavLink to="/addfood" text="ADD" className="text-cyan-400 hover:text-cyan-300" />
                <NavLink to="/allusersorders" text="ALL ORDERS" className="text-cyan-400 hover:text-cyan-300" />
              </>
            )}
          </div>

          {/* Right side - Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* User Profile Button */}
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:border-cyan-400 transition-all duration-300 group"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-black font-black text-xs uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-mono font-bold text-black/80 group-hover:text-cyan-400 tracking-wider">
                    {user?.name?.split(' ')[0]?.toUpperCase() || 'USER'}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-xs font-mono font-bold text-black/60 hover:text-red-400 tracking-wider transition-colors uppercase"
                >
                  EXIT
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 border border-cyan-500 text-cyan-400 text-xs font-bold tracking-wider uppercase hover:bg-cyan-500 hover:text-black transition-all duration-300"
              >
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative w-10 h-10 flex items-center justify-center border text-black border-black/20 hover:border-cyan-400 transition-all duration-300 group"
              aria-expanded={dropdownOpen}
            >
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors"></div>
              {dropdownOpen ? (
                <svg className="h-5 w-5 text-black group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-black group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Premium Design */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/95 backdrop-blur-md border-t border-blue-50/10 overflow-hidden"
          >
            <div className="py-4 px-4 space-y-1">
              <MobileNavLink to="/" text="HOME" onClick={() => setDropdownOpen(false)} />

              {user && (
                <>
                  <MobileNavLink to="/cart" text="CART" onClick={() => setDropdownOpen(false)} />
                  <MobileNavLink to="/profile" text="PROFILE" onClick={() => setDropdownOpen(false)} />
                  <MobileNavLink to="/profile/edit" text="EDIT PROFILE" onClick={() => setDropdownOpen(false)} />
                  <MobileNavLink to="/orderhistory" text="ORDERS" onClick={() => setDropdownOpen(false)} />

                  {/* Admin Links Mobile */}
                  {user?.phone === adminphone && (
                    <>
                      <div className="h-px bg-white/10 my-3"></div>
                      <p className="px-3 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">Admin</p>
                      <MobileNavLink to="/addfood" text="ADD PRODUCT" onClick={() => setDropdownOpen(false)} />
                      <MobileNavLink to="/allusersorders" text="ALL ORDERS" onClick={() => setDropdownOpen(false)} />
                    </>
                  )}
                </>
              )}

              <div className="pt-4 mt-4 border-t border-white/10">
                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-cyan-500 text-cyan-400 text-sm font-bold tracking-wider uppercase hover:bg-cyan-500 hover:text-black transition-all duration-300"
                  >
                    LOGIN
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-3 py-3 text-sm font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors uppercase tracking-wider"
                  >
                    SIGN OUT
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

// Reusable NavLink component for desktop - Premium Streetwear Style
const NavLink = ({ to, text, className = "" }) => (
  <Link
    to={to}
    className={`relative px-3 py-2 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-300 
      text-white/60 hover:text-cyan-400 group ${className}`}
  >
    {text}
    <span className="absolute bottom-0 left-1/2 w-0 h-px bg-cyan-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
  </Link>
);

// Reusable NavLink component for mobile - Premium Style
const MobileNavLink = ({ to, text, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-3 text-xs font-mono font-bold tracking-wider uppercase text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all duration-300 border-l-2 border-transparent hover:border-cyan-400"
  >
    {text}
  </Link>
);

export default Navbar;