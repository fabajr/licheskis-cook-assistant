import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Keep default App styles for now
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import EditRecipe from './pages/EditRecipe';
import MealPlanner from './pages/MealPlanner';
import HormonalCycle from './pages/HormonalCycle';
import GroceryList from './pages/GroceryList';
// We'll move Navbar to its own component file later
// import Navbar from './components/Navbar';

import Navbar from './components/Navbar'; // Import Navbar component

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/create" element={<CreateRecipe />} /> {/* Route for creating recipes */}
          <Route path="/recipes/:id/edit" element={<EditRecipe />} /> {/* Route for editing recipes */}
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/meal-planner" element={<MealPlanner />} />
          <Route path="/hormonal-cycle" element={<HormonalCycle />} />
          <Route path="/grocery-list" element={<GroceryList />} />
          {/* Add a 404 Not Found route later */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
