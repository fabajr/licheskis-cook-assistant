import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <div className="home-hero text-center">
        <div className="container">
          <h1 className="display-4">Licheskis Cook Assistant</h1>
          <p className="lead">Intelligent Meal Planning Based on Hormonal Cycles</p>
          <div className="mt-4">
            <Link to="/meal-planner" className="btn btn-primary btn-lg me-3">
              Start Planning
            </Link>
            <Link to="/recipes" className="btn btn-outline-secondary btn-lg">
              Browse Recipes
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container">
        <h2 className="text-center mb-5">How It Works</h2>
        
        <div className="row">
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Track Your Cycle</h3>
              <p>Enter your hormonal cycle information to get personalized meal recommendations for each phase.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Plan Your Meals</h3>
              <p>Create weekly meal plans with recipes tailored to your current hormonal phase and dietary preferences.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon">🛒</div>
              <h3>Generate Grocery Lists</h3>
              <p>Automatically generate organized grocery lists based on your meal plans, sorted by store categories.</p>
            </div>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md-6 offset-md-3 text-center">
            <h3>Understand Your Hormonal Phases</h3>
            <p className="mb-4">
              Our app helps you plan meals according to the five phases of your hormonal cycle:
            </p>
            <div className="d-flex justify-content-between flex-wrap">
              <span className="badge phase-M p-2">Menstrual (M)</span>
              <span className="badge phase-F p-2">Follicular (F)</span>
              <span className="badge phase-O p-2">Ovulation (O)</span>
              <span className="badge phase-ML p-2">Mid-Luteal (ML)</span>
              <span className="badge phase-LL p-2">Late-Luteal (LL)</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/hormonal-cycle" className="btn btn-primary">
            Set Up Your Cycle
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
