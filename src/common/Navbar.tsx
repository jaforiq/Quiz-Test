import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/features/user/userSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.user.token);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col relative">
      <header className="h-16 mb-10 flex items-center bg-[#e6e1d5] fixed top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-70">
            <div className="flex items-center gap-8 h-full">
              <span>Quiz System</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center">
              {token ? (
                <>
                  <Link to="/">
                    <button
                      className="text-black px-4 py-2 rounded-md hover:bg-blue-600 hover:text-white"
                      onClick={() => {
                        dispatch(logout());
                      }}
                    >
                      Log out
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <button className="text-gray-700 px-4 py-2 rounded-md hover:text-blue-500">
                      Log In
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="text-gray-700 px-4 py-2 rounded-md hover:text-blue-500">
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </nav>

            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-black"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed right-0 bg-[#e6e1d5] flex flex-col items-center gap-4 py-4 shadow-md md:hidden z-50">
          {token ? (
            <>
              <Link to="/create" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="text-black px-4 py-2 rounded-md hover:bg-slate-500 hover:text-white">
                  Create Book
                </button>
              </Link>
              <Link to="/mybook" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="text-black px-4 py-2 rounded-md hover:bg-slate-500 hover:text-white">
                  My Book
                </button>
              </Link>
              <Link to="/" onClick={handleLogout}>
                <button className="text-black px-4 py-2 rounded-md hover:bg-blue-600 hover:text-white">
                  Log out
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="text-gray-700 px-4 py-2 rounded-md hover:bg-blue-300 hover:text-white">
                  Log In
                </button>
              </Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="text-gray-700 px-4 py-2 rounded-md hover:bg-blue-300 hover:text-white">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
