import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Keep default App styles for now

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




// Simple Navbar Component (we'll move this to its own file soon)
const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div className="container-fluid">
      <Link className="navbar-brand" to="/">Lich. Cook Assistant</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link className="nav-link" to="/recipes">Recipes</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/meal-planner">Meal Planner</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/hormonal-cycle">Hormonal Cycle</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/grocery-list">Grocery List</Link>
          </li>
          {/* Add links for Create/Edit later if needed in navbar */}
        </ul>
      </div>
    </div>
  </nav>
);

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
