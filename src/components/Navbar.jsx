import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Licheskis Cook Assistant</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={handleNavCollapse}
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                to="/"
                onClick={() => setIsNavCollapsed(true)}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/recipes' ? 'active' : ''}`} 
                to="/recipes"
                onClick={() => setIsNavCollapsed(true)}
              >
                Recipes
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/meal-planner' ? 'active' : ''}`} 
                to="/meal-planner"
                onClick={() => setIsNavCollapsed(true)}
              >
                Meal Planner
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/grocery-list' ? 'active' : ''}`} 
                to="/grocery-list"
                onClick={() => setIsNavCollapsed(true)}
              >
                Grocery List
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`} 
                to="/profile"
                onClick={() => setIsNavCollapsed(true)}
              >
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
