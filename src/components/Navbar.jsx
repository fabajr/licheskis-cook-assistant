import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css';


function Navbar() {
  const { user, isAdmin, hasHormonalCycle, logout } = useAuth();
  const location = useLocation();
  const avatar = user?.photoURL || '/logo192.png';

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top"
      style={{ height: '60px' }}
    >
      <div className="container d-flex align-items-center">
        <Link className="navbar-brand me-auto" to="/">
          Cook Assistant
        </Link>
        <ul className="navbar-nav mx-auto d-flex flex-row">
          <li className="nav-item px-3">
            <Link
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              to="/"
            >
              Home
            </Link>
          </li>
          <li className="nav-item px-3">
            <Link
              className={`nav-link ${
                location.pathname === '/recipes' ? 'active' : ''
              }`}
              to="/recipes"
            >
              Recipes
            </Link>
          </li>
        </ul>
        <div className="ms-auto">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-link">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary ms-2">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="dropdown">
              <button
                id="userDropdown"
                className="nav-link dropdown-toggle p-0"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img src={avatar} className="rounded-circle" style={{ width: 36, height: 36 }} />
              </button>
              <ul
   className="dropdown-menu dropdown-menu-end shadow mt-2 dropdown-menu-animate"
   aria-labelledby="userDropdown"
 >
                <li className="px-3 py-2">
                  <img
                    src={avatar}
                    className="rounded-circle me-2"
                    style={{ width: 32, height: 32 }}
                  />
                  <Link to="/profile">{user.displayName || 'Profile'}</Link>
                </li>
                <li className="d-md-none">
                  <Link className="dropdown-item" to="/recipes">
                    Recipes
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link
                    className="dropdown-item"
                    to="/profile#hormonal-cycle"
                  >
                    Hormonal Cycle{' '}
                    {hasHormonalCycle && <span>✅</span>}
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/profile#meal-plans">
                    My Meal Plans
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/profile#grocery-lists">
                    My Grocery Lists
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item" to="/meal-planner/new">
                    + New Meal Plan
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/grocery-list/new">
                    + New Grocery List
                  </Link>
                </li>
                {isAdmin && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/create-recipe">
                        + New Recipe
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/ingredients">
                        Edit Ingredients
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item" to="/feedback">
                    Feedback
                  </Link>
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
