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
import HormonalCycle from './pages/HormonalCycle';
import GroceryList from './pages/GroceryList';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Auth

import { ProtectedRoute } from './components/ProtectedRoute';

// Recipe Forms
import CreateRecipe from './components/CreateRecipe';
import EditRecipe from './components/EditRecipe';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container mt-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

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

          {/* Additional Features */}
          <Route path="/meal-planner" element={<MealPlanner />} />
          <Route path="/hormonal-cycle" element={<HormonalCycle />} />
          <Route path="/grocery-list" element={<GroceryList />} />

          {/* Catch-all: redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
