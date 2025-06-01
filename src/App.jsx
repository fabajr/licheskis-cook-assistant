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
      <main className="container mt-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          {/* Recipe Routes */}
          <Route path="/recipes" element={<Recipes />} />
          <Route
            path="/recipes/create"
            element={
              <ProtectedRoute requireAdmin>
                <CreateRecipe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <EditRecipe />
              </ProtectedRoute>
            }
          />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          {/* Additional Features (authenticated users only) */}
          <Route
            path="/meal-planner"
            element={
              <ProtectedRoute>
                <MealPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meal-planner/:id"
            element={
              <ProtectedRoute>
                <MealPlanDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meal-planner/:id/edit"
            element={
              <ProtectedRoute>
                <EditMealPlanner />
              </ProtectedRoute>
            }
          />

          

          {/* Grocery List Routes */}
          
          <Route
            path="/grocery-list"
            element={
              <ProtectedRoute>
                <GroceryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery-list/:id"
            element={
              <ProtectedRoute>
                <GroceryListDetails />
              </ProtectedRoute>
            }
          />
          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route
          path="/admin/ingredients"
          element={
            <ProtectedRoute requireAdmin>
              <ManageIngredients />
            </ProtectedRoute>
          }
        />

        </Routes>
      </main>
    </BrowserRouter>
  );
}
export default App;
