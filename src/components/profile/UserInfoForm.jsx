// src/components/profile/UserInfoForm.jsx
import React, { useState, useEffect } from 'react';

const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'dairy_free', label: 'Dairy Free' },
  { id: 'nut_free', label: 'Nut Free' },
  { id: 'low_carb', label: 'Low Carb' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' }
];

export default function UserInfoForm({ userData, onSubmit, saving }) {
  const [displayName, setDisplayName] = useState('');
  const [calorieTarget, setCalorieTarget] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  
  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.display_name || '');
      setCalorieTarget(userData.preferences?.calorie_target || '');
      setDietaryRestrictions(userData.preferences?.dietary_restrictions || []);
    }
  }, [userData]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      displayName,
      calorieTarget,
      dietaryRestrictions
    });
  };
  
  const handleRestrictionChange = (restrictionId) => {
    setDietaryRestrictions(prev => {
      if (prev.includes(restrictionId)) {
        return prev.filter(id => id !== restrictionId);
      } else {
        return [...prev, restrictionId];
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="displayName" className="form-label">Display Name</label>
        <input
          type="text"
          className="form-control"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={saving}
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          type="email"
          className="form-control"
          id="email"
          value={userData?.email || ''}
          disabled={true}
          readOnly
        />
        <div className="form-text">Email cannot be changed</div>
      </div>
      
      <div className="mb-3">
        <label htmlFor="calorieTarget" className="form-label">Daily Calorie Target</label>
        <input
          type="number"
          className="form-control"
          id="calorieTarget"
          value={calorieTarget}
          onChange={(e) => setCalorieTarget(e.target.value)}
          disabled={saving}
          min="0"
          step="50"
        />
      </div>
      
      <div className="mb-4">
        <label className="form-label d-block">Dietary Restrictions</label>
        <div className="row">
          {DIETARY_RESTRICTIONS.map(restriction => (
            <div key={restriction.id} className="col-md-6 col-lg-4 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`restriction-${restriction.id}`}
                  checked={dietaryRestrictions.includes(restriction.id)}
                  onChange={() => handleRestrictionChange(restriction.id)}
                  disabled={saving}
                />
                <label className="form-check-label" htmlFor={`restriction-${restriction.id}`}>
                  {restriction.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Saving...
          </>
        ) : 'Save Changes'}
      </button>
    </form>
  );
}
