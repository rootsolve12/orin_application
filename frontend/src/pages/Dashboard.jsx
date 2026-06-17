import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents } from '../firebase/firestore';

const CATEGORIES = [
  'All', 'Hackathons', 'Workshops', 'Webinars', 'Seminars', 
  'Coding Competitions', 'Paper Presentations', 'Innovation Challenges', 
  'Research Programs', 'Cultural Events'
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        setEvents(data);
      } catch (err) {
        console.error("Firebase Error:", err);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = selectedCategory === 'All' 
    ? events 
    : events.filter(e => e.category === selectedCategory);

  const trendingEvents = events.filter(e => e.isTrending);
  const recommendedEvents = events.filter(e => e.isRecommended);



  const EventCard = ({ event }) => (
    <div className="event-card" style={{ minWidth: '320px', flex: '0 0 auto' }}>
      <img src={event.image} alt={event.title} className="event-card-img" />
      <div className="event-card-body">
        <span className="badge">{event.category}</span>
        <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-light)' }}>{event.title}</h3>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>{event.location} • {new Date(event.date).toLocaleDateString()}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontWeight: 600 }}>
            {event.registeredCount} / {event.maxCapacity} {event.registeredCount >= event.maxCapacity ? '(Waitlist)' : ''}
          </span>
          <button 
            className="btn-primary" 
            style={{ padding: '8px 16px', background: 'var(--primary)' }}
            onClick={() => navigate(`/event/${event.id}`)}
          >
            View Lifecycle
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h1 className="heading-1">Explore Opportunities</h1>
      <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>Discover hackathons, workshops, and meetups tailored for you.</p>
      


      {/* Category Chips */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px' }}>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
              border: selectedCategory === cat ? 'none' : '1px solid var(--border-light)',
              background: selectedCategory === cat ? 'var(--primary)' : 'white',
              color: selectedCategory === cat ? 'white' : 'var(--text-light)',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Conditionally Render Sections based on Category Selection */}
      {selectedCategory === 'All' ? (
        <>
          <h2 className="heading-2" style={{ marginBottom: '16px' }}>🔥 Trending Now</h2>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', marginBottom: '32px' }}>
            {trendingEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>

          <h2 className="heading-2" style={{ marginBottom: '16px' }}>⭐ Recommended for You</h2>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', marginBottom: '32px' }}>
            {recommendedEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>

          <h2 className="heading-2" style={{ marginBottom: '16px' }}>📅 Upcoming Events</h2>
          <div className="card-grid">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </>
      ) : (
        <>
          <h2 className="heading-2" style={{ marginBottom: '16px' }}>{selectedCategory}</h2>
          <div className="card-grid">
            {filteredEvents.map(e => <EventCard key={e.id} event={e} />)}
            {filteredEvents.length === 0 && <p className="text-muted">No events found in this category.</p>}
          </div>
        </>
      )}

    </div>
  );
}
