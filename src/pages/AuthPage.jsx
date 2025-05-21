// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  // State management
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Set initial mode based on URL path
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      // Redirect to recipes page or to the page they were trying to access before
      const from = location.state?.from || '/profile';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        // Login flow
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/complete-profile');
      } else {
        // Signup flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update display name if provided
        if (displayName.trim()) {
          await updateProfile(user, { displayName: displayName.trim() });
        }
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          display_name: displayName.trim() || '',
          role: 'user',
          preferences: {},
          hormonal_cycle: {},
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        navigate('/complete-profile');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/email-already-in-use':
          setError('Email is already in use');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        case 'auth/invalid-email':
          setError('Email is invalid');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError('An error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFieldErrors({});
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is already authenticated, don't render the form (will redirect via useEffect)
  if (user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>You are already logged in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-4">
                {isLogin ? 'Login to your account' : 'Create your account'}
              </h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>
                
                {/* Password field */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {fieldErrors.password && (
                    <div className="invalid-feedback">{fieldErrors.password}</div>
                  )}
                </div>
                
                {/* Signup-only fields */}
                {!isLogin && (
                  <>
                    {/* Confirm Password field */}
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      {fieldErrors.confirmPassword && (
                        <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
                      )}
                    </div>
                    
                    {/* Display Name field */}
                    <div className="mb-3">
                      <label htmlFor="displayName" className="form-label">
                        Display Name <span className="text-muted">(optional but recommended)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
                
                {/* Submit button */}
                <div className="d-grid gap-2 mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isLogin ? 'Logging in...' : 'Creating account...'}
                      </>
                    ) : (
                      isLogin ? 'Login' : 'Create Account'
                    )}
                  </button>
                </div>
                
                {/* Toggle link */}
                <div className="text-center">
                  <p className="mb-0">
                    {isLogin ? (
                      <>
                        Don't have an account?{' '}
                        <button 
                          type="button" 
                          className="btn btn-link p-0" 
                          onClick={toggleAuthMode}
                          disabled={loading}
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button 
                          type="button" 
                          className="btn btn-link p-0" 
                          onClick={toggleAuthMode}
                          disabled={loading}
                        >
                          Login
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
