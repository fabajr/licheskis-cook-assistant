// src/pages/Profile.jsx
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api/users';
import { getMealPlans, deleteMealPlan } from '../services/api/meal_plans';
import { getGroceryLists, deleteGroceryList } from '../services/api/grocery_lists';
import { calculateCyclePhase } from '../services/utils/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

// Subcomponents
import UserInfoForm from '../components/profile/UserInfoForm';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import HormonalCycleConfig from '../components/profile/HormonalCycleConfig';
import HormonalCalendar from '../components/profile/HormonalCalendar';
import MealPlanCard from '../components/profile/MealPlanCard';
import GroceryListCard from '../components/profile/GroceryListCard';

export default function Profile() {
  // State management
  const [userData, setUserData] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [groceryLists, setGroceryLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ saving: false, success: false, error: null });
  
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const { show } = useToast();
  
  const location = useLocation(); // Get location state to check if coming from meal planner
  const hormonalRef = useRef(null); // Ref to scroll to hormonal cycle section
  const groceryRef = useRef(null); //Ref to scroll to groceryList section
  const [highlightHormonal, setHighlightHormonal] = useState(false); // Highlight hormonal cycle section if coming from meal planner
  const [highlightGrocery, setHighlightGrocery] = useState(false); // Highlight hormonal cycle section if coming from meal planner

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const data = await getUserProfile();
        setUserData(data);
        
        // Fetch meal plans
        
        const mealsData = await getMealPlans();
        console.log('Fetched Meal Plans:', mealsData);
        
        setMealPlans(mealsData);

        const groceryData = await getGroceryLists();
        
        // TODO: Fetch grocery lists when API is available
        setGroceryLists(groceryData);
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);


useLayoutEffect(() => {
   // só quando vier do meal-planner, terminar o loading e o elemento existir
   if ( 
     location.state?.from === 'meal-planner' && location.state?.showHormonalModal === true &&
     !loading &&
     hormonalRef.current 
   ) { 
     setHighlightHormonal(true);
     hormonalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
     const timer = setTimeout(() => setHighlightHormonal(false), 3000);
     return () => clearTimeout(timer);
   }
 }, [location.state, loading]);

 useLayoutEffect(() => {
   // só quando vier do grocery, terminar o loading e o elemento existir
   if ( 
     location.state?.from === 'grocery-list' && location.state?.show === 'GroceryModal' &&
     !loading &&
     groceryRef.current 
   ) { 
     setHighlightGrocery(true);
     groceryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
     const timer = setTimeout(() => setHighlightGrocery(false), 3000);
     return () => clearTimeout(timer);
   }
 }, [location.state, loading]);

  
  // Handle user info update
  const handleUserInfoUpdate = async (updatedInfo) => {
    try {
      setSaveStatus({ saving: true, success: false, error: null });
      console.log('Updated Info:', updatedInfo);
      console.log('User Data:', userData);
      

      await updateUserProfile({ 
        display_name: updatedInfo.displayName,
        preferences: {
          dietary_restrictions: updatedInfo.dietaryRestrictions,
          calorie_target: parseInt(updatedInfo.calorieTarget, 10) || 0
        }
      });
      setUserData(prev => ({
        ...prev,
        display_name: updatedInfo.displayName,
        preferences: {
          ...prev.preferences,
          dietary_restrictions: updatedInfo.dietaryRestrictions,
          calorie_target: parseInt(updatedInfo.calorieTarget, 10) || 0
        }
      }));
      setSaveStatus({ saving: false, success: true, error: null });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (err) {
      console.error('Error updating user info:', err);
      setSaveStatus({ saving: false, success: false, error: 'Failed to update profile. Please try again.' });
    }
  };

  // Handle hormonal cycle update
  const handleCycleUpdate = async (cycleData) => {
    try {
      setSaveStatus({ saving: true, success: false, error: null });
      
      // Calculate mid and late luteal lengths
      const midluteal = Math.floor(cycleData.luteal_length / 2);
      const lateluteal = cycleData.luteal_length - midluteal;
      
      const updatedCycle = {
        ...cycleData,
        midluteal_length: midluteal,
        lateluteal_length: lateluteal,
        updated_at: new Date()
      };
      
      await updateUserProfile({ 
        hormonal_cycle: updatedCycle
      });
      console.log('Updated Cycle:', updatedCycle);
      
      setUserData(prev => ({
        ...prev,
        hormonal_cycle: updatedCycle
      }));
      
      setSaveStatus({ saving: false, success: true, error: null });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (err) {
      console.error('Error updating hormonal cycle:', err);
      setSaveStatus({ saving: false, success: false, error: 'Failed to update hormonal cycle. Please try again.' });
    }
  };

  // Handle meal plan deletion
  const handleDeleteMealPlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await deleteMealPlan(id);
        setMealPlans(prev => prev.filter(plan => plan.id !== id));
      } catch (err) {
        console.error('Error deleting meal plan:', err);
        show('Failed to delete meal plan. Please try again.');
      }
    }
  };

  // Handle grocery list deletion
  const handleDeleteGroceryList = async (id) => {
    if (window.confirm('Are you sure you want to delete this grocery list?')) {
      try {
        
        await deleteGroceryList(id);
        
        setGroceryLists(prev => prev.filter(list => list.id !== id));
      } catch (err) {
        console.error('Error deleting grocery list:', err);
        show('Failed to delete grocery list. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    setError(null);
    
    try {
      await logout();
      
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Erro no logout', err);
    } 
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="profile-page py-4">
      <h1 className="mb-4">Your Profile</h1>
      
      {saveStatus.success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          Changes saved successfully!
          <button type="button" className="btn-close" onClick={() => setSaveStatus(prev => ({ ...prev, success: false }))}></button>
        </div>
      )}
      
      {saveStatus.error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {saveStatus.error}
          <button type="button" className="btn-close" onClick={() => setSaveStatus(prev => ({ ...prev, error: null }))}></button>
        </div>
      )}
      
      {/* Top row: User Info and Profile Picture */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <UserInfoForm 
                userData={userData} 
                onSubmit={handleUserInfoUpdate} 
                saving={saveStatus.saving}
              />
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Profile Picture</h5>
            </div>
            <div className="card-body text-center">
              <ProfileAvatar 
                displayName={userData?.display_name} 
                photoUrl={userData?.photo_url} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Hormonal Cycle Settings */}
      <div
        ref={hormonalRef}           
        className={`card shadow-sm mb-4 transition-shadow ${
          highlightHormonal ? 'shadow-lg border-primary' : ''
        }`}
        style={{ transition: 'box-shadow 0.3s, border-color 0.3s' }}
      >
        <div className="card-header bg-light">
          <h5 className="mb-0">Hormonal Cycle Settings</h5>
        </div>
        <div className="card-body">
          <HormonalCycleConfig 
            cycleData={userData?.hormonal_cycle} 
            onSubmit={handleCycleUpdate}
            saving={saveStatus.saving}
          />
        </div>
      </div>
      
      {/* Hormonal Phase Calendar */}
      {userData?.hormonal_cycle?.start_date && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Your Hormonal Phase Calendar</h5>
          </div>
          <div className="card-body">
            <HormonalCalendar 
              cycleData={userData.hormonal_cycle} 
              calculatePhase={calculateCyclePhase} 
            />
          </div>
        </div>
      )}
      
      {/* Meal Plans Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Your Meal Plans</h5>
          <Link to="/meal-planner" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> New Meal Plan
          </Link>
        </div>
        <div className="card-body">
          {mealPlans.length > 0 ? (
            <div className="row">
              {mealPlans.map(plan => (
                <div key={plan.id} className="col-md-6 col-lg-4 mb-3">
                  <MealPlanCard 
                    mealPlan={plan} 
                    onDelete={() => handleDeleteMealPlan(plan.id)} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">You don't have any meal plans yet.</p>
          )}
        </div>
      </div>
      
      {/* Grocery Lists Section */}
       
      <div 
        ref={groceryRef}
        className={`card shadow-sm mb-4 transition-shadow ${
          highlightGrocery ? 'shadow-lg border-primary' : ''
        }`}
        style={{ transition: 'box-shadow 0.3s, border-color 0.3s' }}>
        
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Your Grocery Lists</h5>
          <Link to="/grocery-list" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> Generate New Grocery List
          </Link>
        </div>
        <div className="card-body">
          {groceryLists.length > 0 ? (
            <div className="row">
              {groceryLists.map(list => (
                <div key={list.id} className="col-md-6 col-lg-4 mb-3">
                                   
                  <GroceryListCard 
                    groceryList={list} 
                    onDelete={() => handleDeleteGroceryList(list.id)} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">You don't have any grocery lists yet.</p>
          )}
        </div>
      </div>


      {/* Botão de logout no fim da página */}
      <div className="mt-4 text-center">
        <button
          onClick={handleLogout}
          className="btn btn-danger"
        >
          Logout
        </button>
      </div>

    </div>
  );
}
