import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Layout
import Navbar from './components/Navbar';
// Pages
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import MealPlanner from './pages/MealPlanner';
import MealPlanDetails from './pages/MealPlanDetails';
import EditMealPlanner from './pages/EditMealPlanner';
import GroceryList from './pages/GroceryList';
import GroceryListDetails from './pages/GroceryListDetails';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import ManageIngredients from './pages/ManageIngredients';

// Auth
import { ProtectedRoute } from './components/ProtectedRoute';
// Recipe Forms
import CreateRecipe from './pages/CreateRecipe';
import EditRecipe from './pages/EditRecipe';
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>
        <main className="container mt-4">
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/profile" element={
            <ProtectedRoute message="Please log in to access your profile.">
              <Profile />
            </ProtectedRoute>
          } />
          {/* Recipe Routes */}
          <Route path="/recipes" element={<Recipes />} />
          <Route
            path="/recipes/create"
            element={
              <ProtectedRoute requireAdmin message="Admin access required.">
                <CreateRecipe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute requireAdmin message="Admin access required.">
                <EditRecipe />
              </ProtectedRoute>
            }
          />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          {/* Additional Features (authenticated users only) */}
          <Route
            path="/meal-planner"
            element={
              <ProtectedRoute message="Please log in to use the meal planner.">
                <MealPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meal-planner/:id"
            element={
              <ProtectedRoute message="Please log in to view meal plan details.">
                <MealPlanDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meal-planner/:id/edit"
            element={
              <ProtectedRoute message="Please log in to edit meal plans.">
                <EditMealPlanner />
              </ProtectedRoute>
            }
          />

          

          {/* Grocery List Routes */}
          
          <Route
            path="/grocery-list"
            element={
              <ProtectedRoute message="Please log in to view your grocery lists.">
                <GroceryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery-list/:id"
            element={
              <ProtectedRoute message="Please log in to view this grocery list.">
                <GroceryListDetails />
              </ProtectedRoute>
            }
          />
          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route
          path="/admin/ingredients"
          element={
            <ProtectedRoute requireAdmin message="Admin access required.">
              <ManageIngredients />
            </ProtectedRoute>
          }
        />

        </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
