import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

function Navbar() {
  const { user, isAdmin, hasHormonalCycle, logout } = useAuth();
  const location = useLocation();
  const avatar = user?.photoURL || '/logo192.png';

  return (
    <nav className="navbar navbar-expand-md navbar-fb fixed-top border-bottom">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">Cook Assistant</Link>
        <ul className="navbar-nav mx-auto d-none d-md-flex">
          <li className="nav-item">
            <NavLink end to="/" className="nav-link">
              Home
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/recipes" className="nav-link">
              Recipes
            </NavLink>
          </li>
        </ul>
        {!user && (
          <div className="ms-auto d-flex">
            <Link className="btn btn-link me-2" to="/login">Login</Link>
            <Link className="btn btn-primary" to="/signup">Sign Up</Link>
          </div>
        )}
        {user && (
          <div className="dropdown ms-auto">
            <button
              className="btn p-0 border-0 bg-transparent"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src={avatar} alt="avatar" className="nav-avatar" />
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow dropdown-menu-animate" aria-labelledby="userDropdown">
              <li>
                <Link to="/profile" className="dropdown-item d-flex align-items-center">
                  <img src={avatar} alt="avatar" className="me-2 rounded-circle" style={{ width: 24, height: 24 }} />
                  {user.displayName || 'Profile'}
                </Link>
              </li>
              <li className="d-md-none">
                <NavLink to="/recipes" className="dropdown-item">Recipes</NavLink>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li><h6 className="dropdown-header">My Data</h6></li>
              <li>
                <NavLink to="/profile#hormonal-cycle" className="dropdown-item d-flex justify-content-between align-items-center">
                  <span>Hormonal Cycle</span>
                  {hasHormonalCycle && <i className="bi bi-check2"></i>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile#meal-plans" className="dropdown-item">My Meal Plans</NavLink>
              </li>
              <li>
                <NavLink to="/profile#grocery-lists" className="dropdown-item">My Grocery Lists</NavLink>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li><h6 className="dropdown-header">Quick Actions</h6></li>
              <li>
                <NavLink to="/meal-planner/new" className="dropdown-item">+ New Meal Plan</NavLink>
              </li>
              <li>
                <NavLink to="/grocery-list/new" className="dropdown-item">+ New Grocery List</NavLink>
              </li>
              {isAdmin && (
                <>
                  <li><hr className="dropdown-divider" /></li>
                  <li><h6 className="dropdown-header">Admin</h6></li>
                  <li>
                    <NavLink to="/create-recipe" className="dropdown-item">+ New Recipe</NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/ingredients" className="dropdown-item">Edit Ingredients</NavLink>
                  </li>
                </>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li><h6 className="dropdown-header">Misc</h6></li>
              <li>
                <NavLink to="/feedback" className="dropdown-item">Feedback</NavLink>
              </li>
              <li>
                <button className="dropdown-item" onClick={logout}>Logout</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
