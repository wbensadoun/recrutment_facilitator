import React from 'react';
import { Link } from 'react-router-dom';
import { debug } from '../utils/debug';

const MainNavbar = () => {
  debug('[NAVBAR] Rendered');
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <Link to="/" className="text-xl font-bold">
            Apply interview easily
          </Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-blue-200 transition-colors">
            Home
          </Link>
          {/* The "PDF Management" button has been removed as requested */}
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
