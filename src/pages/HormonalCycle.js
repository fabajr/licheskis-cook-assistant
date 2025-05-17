// src/pages/HormonalCycle.js
import React, { useState } from 'react';

// Utility to add days to a date string (YYYY-MM-DD)
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Fallback/simulation for createHormonalCycle
const createHormonalCycle = async ({ start_date, cycle_length, period_length }) => {
  console.log('Simulated createHormonalCycle payload:', { start_date, cycle_length, period_length });
  // Simulate phase boundaries
  const mStart = start_date;
  const mEnd = addDays(start_date, period_length - 1);

  // Assume ovulation at mid-cycle
  const ovIndex = Math.floor(cycle_length / 2);
  const oStart = addDays(start_date, ovIndex);
  const oEnd = oStart;

  // Follicular: day after mEnd until day before ovulation
  const fStart = addDays(mEnd, 1);
  const fEnd = addDays(start_date, ovIndex - 1);

  // Mid-Luteal: 7 days after ovulation
  const mlStart = addDays(oEnd, 1);
  const mlEnd = addDays(oEnd, 7);

  // Late-Luteal: from mlEnd+1 to end of cycle
  const llStart = addDays(mlEnd, 1);
  const llEnd = addDays(start_date, cycle_length - 1);

  return {
    phase_dates: {
      menstrual:    { start: mStart, end: mEnd },
      follicular:   { start: fStart, end: fEnd },
      ovulation:    { start: oStart, end: oEnd },
      mid_luteal:   { start: mlStart, end: mlEnd },
      late_luteal:  { start: llStart, end: llEnd }
    }
  };
};

function HormonalCycle() {
  const [startDate, setStartDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [cycleData, setCycleData] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!startDate) {
      setError('Please select a start date');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        start_date:    startDate,
        cycle_length:  parseInt(cycleLength, 10),
        period_length: parseInt(periodLength, 10)
      };
      const result = await createHormonalCycle(payload);
      setCycleData(result);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate hormonal cycle.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Hormonal Cycle Tracker</h1>
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Enter Your Cycle Information</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="cycle-form">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                  <label htmlFor="startDate" className="form-label">First Day of Last Period</label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="cycleLength" className="form-label">Average Cycle Length (days)</label>
                  <input
                    id="cycleLength"
                    type="number"
                    className="form-control"
                    min="21"
                    max="45"
                    value={cycleLength}
                    onChange={e => setCycleLength(e.target.value)}
                    required
                  />
                  <div className="form-text">Most cycles are between 21-35 days</div>
                </div>

                <div className="mb-4">
                  <label htmlFor="periodLength" className="form-label">Average Period Length (days)</label>
                  <input
                    id="periodLength"
                    type="number"
                    className="form-control"
                    min="2"
                    max="10"
                    value={periodLength}
                    onChange={e => setPeriodLength(e.target.value)}
                    required
                  />
                  <div className="form-text">Most periods last between 3-7 days</div>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <> <span className="spinner-border spinner-border-sm me-2" role="status" />Processing...</>
                  ) : (
                    'Calculate Cycle Phases'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Your Hormonal Phases</h4>
            </div>
            <div className="card-body">
              {success && cycleData ? (
                <>
                  <div className="alert alert-success mb-4">Calculated successfully!</div>

                  {Object.entries(cycleData.phase_dates).map(([key, { start, end }]) => (
                    <div key={key} className="mb-4">
                      <h5>{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')} Phase ({key.toUpperCase()})</h5>
                      <p className="mb-1"><strong>Start:</strong> {formatDate(start)}</p>
                      <p><strong>End:</strong> {formatDate(end)}</p>
                      <div className="progress mb-3">
                        <div className={`progress-bar phase-${key.toUpperCase()}`} role="progressbar" style={{ width: `${((new Date(end) - new Date(start))/(1000*60*60*24)+1)/cycleLength*100}%` }} />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="mb-4">Enter your cycle information to see your hormonal phases.</p>
                  <div className="d-flex justify-content-between flex-wrap">
                    {['M','F','O','ML','LL'].map(code => (
                      <span key={code} className={`badge phase-${code} p-2 me-2`}>{code}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HormonalCycle;
