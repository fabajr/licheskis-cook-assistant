// src/components/grocery/GroceryPreview.jsx
import React from 'react';

export default function GroceryPreview({ title, items }) {

  
  
  return (
    <div className="card-body">
      <div className="card-header bg-light">
        <h4 className="h6 mb-0">{title}</h4>
      </div>
      <ul className="list-group list-group-flush">
        {items.map((item, index) => (
          <li key={index} className="list-group-item">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id={`item-${title}-${index}`}
              />
              <label className="form-check-label" htmlFor={`item-${title}-${index}`}>
                {item.name}: {item.quantity} {item.unit}
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
