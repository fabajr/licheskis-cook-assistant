// src/components/profile/HormonalCycleConfig.jsx
import React, { useState, useEffect, use } from 'react';

export default function HormonalCycleConfig({ cycleData, onSubmit, saving }) {
  const [startDate, setStartDate] = useState('');
  const [cycleLength, setCycleLength] = useState('');
  const [menstrualLength, setMenstrualLength] = useState('');
  const [follicularLength, setFollicularLength] = useState('');
  const [ovulatoryLength, setOvulatoryLength] = useState('');
  const [lutealLength, setLutealLength] = useState('');
  
  // Initialize form with user data
  useEffect(() => {
    if (cycleData) {
      // Format date to YYYY-MM-DD for input
      if (cycleData.start_date) {
        let date;
        if (typeof cycleData.start_date === 'string') {
          date = new Date(cycleData.start_date);
        } else if (cycleData.start_date.toDate) {
          // Handle Firestore Timestamp
          date = cycleData.start_date.toDate();
        } else if (cycleData.start_date._seconds) {
          // Handle serialized Firestore Timestamp
          date = new Date(cycleData.start_date._seconds * 1000);
        }
        
        if (date && !isNaN(date.getTime())) {
          setStartDate(date.toISOString().split('T')[0]);
        }
      }
      
      setCycleLength(cycleData.cycle_length?.toString() || '');
      setMenstrualLength(cycleData.menstrual_length?.toString() || '');
      setFollicularLength(cycleData.follicular_length?.toString() || '');
      setOvulatoryLength(cycleData.ovulatory_length?.toString() || '');
      setLutealLength(cycleData.luteal_length?.toString() || '');
    }
  }, [cycleData]);

  useEffect(() => {
    if (menstrualLength || follicularLength || ovulatoryLength || lutealLength) { 
      const m = isNaN(parseInt(menstrualLength, 10)) ? 0 : parseInt(menstrualLength, 10);
      const f = isNaN(parseInt(follicularLength, 10)) ? 0 : parseInt(follicularLength, 10);
      const o = isNaN(parseInt(ovulatoryLength, 10)) ? 0 : parseInt(ovulatoryLength, 10);
      const l = isNaN(parseInt(lutealLength, 10)) ? 0 : parseInt(lutealLength, 10);
      const totalLength = m + f + o + l;

      setCycleLength(totalLength.toString());

    }}, [menstrualLength, follicularLength, ovulatoryLength, lutealLength]);

  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that lengths add up to cycle length
    const totalLength = parseInt(menstrualLength, 10) + 
                        parseInt(follicularLength, 10) + 
                        parseInt(ovulatoryLength, 10) + 
                        parseInt(lutealLength, 10);

                        
    if (totalLength !== parseInt(cycleLength, 10)) {
      alert(`The sum of all phase lengths (${totalLength}) must equal the cycle length (${cycleLength}).`);
      return;
    }
    
    onSubmit({
      start_date: new Date(`${startDate}T00:00`),
      cycle_length: parseInt(cycleLength, 10),
      menstrual_length: parseInt(menstrualLength, 10),
      follicular_length: parseInt(follicularLength, 10),
      ovulatory_length: parseInt(ovulatoryLength, 10),
      luteal_length: parseInt(lutealLength, 10)
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="startDate" className="form-label">First Day of Last Period</label>
          <input
            type="date"
            className="form-control"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={saving}
            required
          />
        </div>
        
        <div className="col-md-6 mb-3">
          <label htmlFor="cycleLength" className="form-label">Cycle Length (days)</label>
          <input
            type="number"
            className="form-control"
            id="cycleLength"
            value={cycleLength}
            onChange={(e) => setCycleLength(e.target.value)}
            min="21"
            max="45"
            disabled={saving}
            required
          />
          <div className="form-text">Most cycles are between 21-35 days</div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 col-lg-3 mb-3">
          <label htmlFor="menstrualLength" className="form-label">Menstrual Phase (days)</label>
          <input
            type="number"
            className="form-control"
            id="menstrualLength"
            value={menstrualLength}
            onChange={(e) => setMenstrualLength(e.target.value)}
            min="2"
            max="10"
            disabled={saving}
            required
          />
        </div>
        
        <div className="col-md-6 col-lg-3 mb-3">
          <label htmlFor="follicularLength" className="form-label">Follicular Phase (days)</label>
          <input
            type="number"
            className="form-control"
            id="follicularLength"
            value={follicularLength}
            onChange={(e) => setFollicularLength(e.target.value)}
            min="3"
            max="14"
            disabled={saving}
            required
          />
        </div>
        
        <div className="col-md-6 col-lg-3 mb-3">
          <label htmlFor="ovulatoryLength" className="form-label">Ovulatory Phase (days)</label>
          <input
            type="number"
            className="form-control"
            id="ovulatoryLength"
            value={ovulatoryLength}
            onChange={(e) => setOvulatoryLength(e.target.value)}
            min="1"
            max="5"
            disabled={saving}
            required
          />
        </div>
        
        <div className="col-md-6 col-lg-3 mb-3">
          <label htmlFor="lutealLength" className="form-label">Luteal Phase (days)</label>
          <input
            type="number"
            className="form-control"
            id="lutealLength"
            value={lutealLength}
            onChange={(e) => setLutealLength(e.target.value)}
            min="7"
            max="16"
            disabled={saving}
            required
          />
          <div className="form-text">Will be split into Mid and Late phases</div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : 'Save Cycle Settings'}
          </button>
        </div>
        
        <div className="text-muted">
          {cycleData?.updated_at && (
            <small>
              Last updated: {new Date(cycleData.updated_at).toLocaleDateString()}
            </small>
          )}
        </div>
      </div>
    </form>
  );
}
