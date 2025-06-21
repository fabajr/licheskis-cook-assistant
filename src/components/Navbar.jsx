import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import 'bootstrap/dist/css/bootstrap.min.css'
import './Navbar.css'

export default function Navbar() {
  const { user, isAdmin, hasHormonalCycle, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const avatar = user?.photoURL || '/logo192.png'

  return (
    <nav className="navbar-custom">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-brand">Cook Assistant</Link>

        {/* Links centrais */}
        <ul className="navbar-nav-center">
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">Home</Link>
          </li>
          <li className={location.pathname === '/recipes' ? 'active' : ''}>
            <Link to="/recipes">Recipes</Link>
          </li>
        </ul>

        {/* Ações à direita */}
        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn-link">Login</Link>
              <Link to="/signup" className="btn btn-primary ms-2">Sign Up</Link>
            </>
          ) : (
            <div className="avatar-dropdown" ref={dropdownRef}>
              <img
                src={avatar}
                alt="avatar"
                className="avatar-toggle"
                onClick={() => setOpen(o => !o)}
              />

              {open && (
                <ul className="avatar-menu">
                  {/* Header */}
                  <li className="menu-header">
                    <img src={avatar} alt="" className="avatar-sm" />
                    <Link to="/profile">{user.displayName || 'Profile'}</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {/* My Data */}
                  <li>
                    <Link to="/profile#hormonal-cycle">
                      Hormonal Cycle {hasHormonalCycle && '✅'}
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile#meal-plans">My Meal Plans</Link>
                  </li>
                  <li>
                    <Link to="/profile#grocery-lists">My Grocery Lists</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {/* Quick Actions */}
                  <li>
                    <Link to="/meal-planner/new">New Meal Plan</Link>
                  </li>
                  <li>
                    <Link to="/grocery-list/new">New Grocery List</Link>
                  </li>
                  {isAdmin && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link to="/create-recipe">New Recipe</Link>
                      </li>
                      <li>
                        <Link to="/admin/ingredients">Edit Ingredients</Link>
                      </li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  {/* Misc */}
                  <li>
                    <Link to="/feedback">Feedback</Link>
                  </li>
                  <li>
                    <button className="text-danger btn-link w-100 text-start" onClick={logout}>
                    Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
