import React, { useState, useEffect, useRef } from 'react';

export default function HormonalCalendar({ cycleData, calculatePhase }) {
  const [calendarDays, setCalendarDays] = useState([]);
  const carouselRef = useRef(null);
  const DAYS_BATCH = 35;

  // Generate initial days
  useEffect(() => {
    if (!cycleData || !cycleData.start_date) return;
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < DAYS_BATCH; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const phase = calculatePhase(dateStr, cycleData);
      days.push({ date, dateStr, phase });
    }

    setCalendarDays(days);
  }, [cycleData, calculatePhase]);

  // Load more when scrolling near end
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 100) {
        loadMoreDays();
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [calendarDays]);

  const loadMoreDays = () => {
    if (!calendarDays.length) return;
    const lastDate = new Date(calendarDays[calendarDays.length - 1].date);
    const newDays = [];
    for (let i = 1; i <= DAYS_BATCH; i++) {
      const date = new Date(lastDate);
      date.setDate(lastDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const phase = calculatePhase(dateStr, cycleData);
      newDays.push({ date, dateStr, phase });
    }
    setCalendarDays(prev => [...prev, ...newDays]);
  };

  if (!cycleData || !cycleData.start_date || calendarDays.length === 0) {
    return (
      <div className="alert alert-info">
        Please configure your hormonal cycle settings to view the calendar.
      </div>
    );
  }

  // Arrow scroll helpers
  const scrollBy = offset => {
    const el = carouselRef.current;
    if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="position-relative">
      {/* Left arrow */}
      <button
        onClick={() => scrollBy(-300)}
        className="position-absolute top-50 start-0 translate-middle-y btn btn-light p-2"
        style={{ zIndex: 1, opacity: 0.7 }}
      >
        ‹
      </button>

      <div
        ref={carouselRef}
        className="d-flex overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {calendarDays.map((day, idx) => {
          const weekday = day.date.toLocaleString('default', { weekday: 'short' });
          const month = String(day.date.getMonth() + 1).padStart(2, '0');
          const dateNum = String(day.date.getDate()).padStart(2, '0');

          return (
            <div
              key={idx}
              className="flex-shrink-0 p-2"
              style={{ width: 100, scrollSnapAlign: 'start' }}
            >
              <div className={`card text-center phase-${day.phase} text-white`}>
                <div className="card-body p-1">
                  <div className="fw-bold">{weekday}</div>
                  <div>{`${month}/${dateNum}`}</div>
                  <span className="badge bg-light text-dark mt-1">{day.phase}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy(300)}
        className="position-absolute top-50 end-0 translate-middle-y btn btn-light p-2"
        style={{ zIndex: 1, opacity: 0.7 }}
      >
        ›
      </button>
    </div>
  );
}
