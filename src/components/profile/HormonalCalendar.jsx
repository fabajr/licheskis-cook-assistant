// src/components/profile/HormonalCalendar.jsx
import React, { useState, useEffect } from 'react';

export default function HormonalCalendar({ cycleData, calculatePhase }) {
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Phase colors and labels
  const phaseInfo = {
    'M': { color: '#dc3545', label: 'Menstrual' },
    'F': { color: '#0d6efd', label: 'Follicular' },
    'O': { color: '#ffc107', label: 'Ovulatory' },
    'ML': { color: '#6f42c1', label: 'Mid-Luteal' },
    'LL': { color: '#6c757d', label: 'Late-Luteal' }
  };
  
  useEffect(() => {
    if (!cycleData || !cycleData.start_date) return;
    
    // Generate calendar days for the next 35 days
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Set month name
    setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }));
    
    // Generate days
    for (let i = 0; i < 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const phase = calculatePhase(dateStr, cycleData);
      
      days.push({
        date,
        dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        phase,
        isToday: i === 0
      });
    }
    
    setCalendarDays(days);
  }, [cycleData, calculatePhase]);
  
  if (!cycleData || !cycleData.start_date || calendarDays.length === 0) {
    return (
      <div className="alert alert-info">
        Please configure your hormonal cycle settings to view the calendar.
      </div>
    );
  }
  
  return (
    <div className="hormonal-calendar">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{currentMonth}</h5>
        <div className="phase-legend d-flex">
          {Object.entries(phaseInfo).map(([key, { color, label }]) => (
            <div key={key} className="ms-3 d-flex align-items-center">
              <span 
                className="badge rounded-pill me-1" 
                style={{ backgroundColor: color, width: '30px' }}
              >
                {key}
              </span>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="row row-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="col fw-bold">{day}</div>
          ))}
        </div>
        
        <div className="row row-cols-7">
          {calendarDays.map((day, index) => {
            const phase = day.phase;
            const phaseColor = phaseInfo[phase]?.color || '#6c757d';
            
            return (
              <div key={index} className="col p-1">
                <div 
                  className={`calendar-day rounded p-2 text-center ${day.isToday ? 'border border-dark' : ''}`}
                  style={{ 
                    backgroundColor: phaseColor,
                    opacity: day.month !== calendarDays[0].month ? 0.5 : 1
                  }}
                >
                  <span className="badge bg-light text-dark">{day.day}</span>
                  <div className="mt-1">
                    <small className="text-white">{phase}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
