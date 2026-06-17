import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckSquare, 
  Clock, 
  MapPin, 
  ExternalLink, 
  CheckCircle,
  CalendarRange,
  X,
  Compass,
  Award,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRegistrations, getEventRegistration } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { seedEventsOnce } from '../utils/seedEvents';
import { Search } from 'lucide-react';

export default function MyEvents() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('Month'); // 'Month' | 'Week'
  const [loading, setLoading] = useState(true);

  // Fallback for visual guidance and offline testing
  const MOCK_REGISTRATIONS = [
    {
      id: 'mock1',
      title: 'Web3 Security Workshop',
      date: '2026-06-18',
      endDate: '2026-06-19',
      registrationDeadline: '2026-06-15',
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Virtual Zoom Room',
      startTime: '10:00',
      endTime: '12:00',
      mode: 'Online'
    },
    {
      id: 'mock2',
      title: 'Solidity Advanced Assessment',
      date: '2026-06-20',
      endDate: '2026-06-20',
      registrationDeadline: '2026-06-18',
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Assessment Portal',
      startTime: '14:00',
      endTime: '16:00',
      mode: 'Online'
    },
    {
      id: 'mock3',
      title: 'Orin Community Hackathon',
      date: '2026-06-22',
      endDate: '2026-06-25',
      registrationDeadline: '2026-06-19',
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Main Auditorium & GitHub',
      startTime: '09:00',
      endTime: '18:00',
      mode: 'Hybrid'
    }
  ];

  // Helper to parse any date format into local YYYY-MM-DD string safely
  const parseToLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    let d;
    if (typeof dateInput.toDate === 'function') {
      d = dateInput.toDate();
    } else if (dateInput.seconds) {
      d = new Date(dateInput.seconds * 1000);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to get local YYYY-MM-DD from a Date object
  const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const fetchRegs = async () => {
      if (currentUser) {
        // Automatically inject real-time flawless test events once if needed
        const didSeed = await seedEventsOnce(currentUser);
        if (didSeed) {
          window.location.reload();
          return;
        }

        try {
          const regs = await getUserRegistrations(currentUser.uid);
          const regsWithStatus = await Promise.all(
            regs.map(async (event) => {
              try {
                const regDoc = await getEventRegistration(event.id, currentUser.uid);
                return {
                  ...event,
                  registrationStatus: regDoc?.status || 'Registered'
                };
              } catch (e) {
                console.warn("Failed to fetch reg status for event:", event.id, e);
                return {
                  ...event,
                  registrationStatus: 'Registered'
                };
              }
            })
          );
          setRegistrations(regsWithStatus);
        } catch (err) {
          console.error("Error fetching registrations:", err);
        }
      }
      setLoading(false);
    };
    fetchRegs();
  }, [currentUser]);

  const activeEvents = registrations.length > 0 ? registrations : MOCK_REGISTRATIONS;

  const getCategoryColor = (category) => {
    if (!category) return '#7B61FF';
    const c = category.toLowerCase();
    if (c.includes('hackathon')) return '#EC4899'; // Pink
    if (c.includes('webinar')) return '#14B8A6'; // Teal
    if (c.includes('coding') || c.includes('challenge')) return '#F59E0B'; // Orange
    return '#7B61FF';
  };

  const addToGoogleCalendar = (event) => {
    const startStr = parseToLocalDateString(event.date || event.createdAt);
    const endStr = parseToLocalDateString(event.endDate) || startStr;
    const start = startStr.replace(/-/g, '') + 'T' + (event.startTime ? event.startTime.replace(/:/g, '') + '00' : '090000') + 'Z';
    const end = endStr.replace(/-/g, '') + 'T' + (event.endTime ? event.endTime.replace(/:/g, '') + '00' : '170000') + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent('Event Link: Orin Platform')}&location=${encodeURIComponent(event.location || 'Online')}`;
    window.open(url, '_blank');
  };

  // Navigation functions
  const handleNext = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    }
  };

  const handlePrev = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate calendar dates
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getMonthDays = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysList = [];

    // Previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      const num = daysInPrevMonth - firstDayIndex + i + 1;
      daysList.push({
        num,
        isPrevMonth: true,
        fullDate: new Date(year, month - 1, num)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      daysList.push({
        num: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i)
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const totalCells = daysList.length > 35 ? 42 : 35;
    const paddingNeeded = totalCells - daysList.length;
    for (let i = 1; i <= paddingNeeded; i++) {
      daysList.push({
        num: i,
        isNextMonth: true,
        fullDate: new Date(year, month + 1, i)
      });
    }

    return daysList;
  };

  const getWeekDays = () => {
    const dayOfWeek = currentDate.getDay();
    const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);

    const daysList = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      daysList.push({
        num: day.getDate(),
        isCurrentMonth: day.getMonth() === month,
        fullDate: day
      });
    }
    return daysList;
  };

  const days = viewMode === 'Month' ? getMonthDays() : getWeekDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Label for date range display
  const getHeaderLabel = () => {
    if (viewMode === 'Month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      const dayOfWeek = currentDate.getDay();
      const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
      const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
      
      const options = { month: 'short', day: 'numeric' };
      const startStr = sunday.toLocaleDateString('default', options);
      const endStr = saturday.toLocaleDateString('default', options);
      return `${startStr} - ${endStr}, ${saturday.getFullYear()}`;
    }
  };

  // Check event presence on a particular calendar day cell
  const getIndicatorsForDate = (cellDate) => {
    const cellStr = getLocalDateString(cellDate);
    const dayEvents = activeEvents.filter(e => {
      const startStr = parseToLocalDateString(e.date || e.createdAt);
      const endStr = parseToLocalDateString(e.endDate) || startStr;
      const deadlineStr = parseToLocalDateString(e.registrationDeadline);

      const isEventDay = cellStr >= startStr && cellStr <= endStr;
      const isDeadlineDay = cellStr === deadlineStr;
      return isEventDay || isDeadlineDay;
    });

    const dots = [];
    dayEvents.forEach(e => {
      const startStr = parseToLocalDateString(e.date || e.createdAt);
      const endStr = parseToLocalDateString(e.endDate) || startStr;
      const deadlineStr = parseToLocalDateString(e.registrationDeadline);

      if (cellStr === deadlineStr && !dots.includes('#EF4444')) {
        dots.push('#EF4444'); // Red for deadline
      }
      if (cellStr >= startStr && cellStr <= endStr) {
        const regStatus = e.registrationStatus || 'Registered';
        if (regStatus === 'Waitlisted' && !dots.includes('#3B82F6')) {
          dots.push('#3B82F6'); // Blue for waitlist
        } else if (!dots.includes('#7B61FF')) {
          dots.push('#7B61FF'); // Purple for registered/approved
        }
      }
    });
    return dots;
  };

  // Filter events matching the selectedDate or showing current month/week events as fallback
  const getAgendaEvents = () => {
    let eventsToFilter = activeEvents;
    
    if (searchQuery) {
      eventsToFilter = eventsToFilter.filter(e => 
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      const selStr = getLocalDateString(selectedDate);
      return eventsToFilter.filter(e => {
        const startStr = parseToLocalDateString(e.date || e.createdAt);
        const endStr = parseToLocalDateString(e.endDate) || startStr;
        const deadlineStr = parseToLocalDateString(e.registrationDeadline);

        const isEventDay = selStr >= startStr && selStr <= endStr;
        const isDeadlineDay = selStr === deadlineStr;
        return isEventDay || isDeadlineDay;
      });
    }

    // Fallback: list of upcoming events in the currently viewed month or week
    return eventsToFilter.filter(e => {
      const startStr = parseToLocalDateString(e.date || e.createdAt);
      const d = new Date(startStr);
      if (isNaN(d.getTime())) return false;
      
      if (viewMode === 'Month') {
        return d.getFullYear() === year && d.getMonth() === month;
      } else {
        const dayOfWeek = currentDate.getDay();
        const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
        const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
        return d >= sunday && d <= saturday;
      }
    }).sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  };

  const agendaEvents = getAgendaEvents();

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '900px', 
      margin: '0 auto', 
      background: '#FCFCFD', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      gap: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.5px' }}>My Calendar</h1>
          <p style={{ color: '#6C757D', fontSize: '14px' }}>Track your active academic assessments, hackathons, and deadlines</p>
        </div>
        
        {/* Controls Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '24px', padding: '8px 16px', border: '1px solid #E9ECEF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <Search size={16} color="#868E96" />
            <input 
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: '8px', fontSize: '13px', width: '150px', color: '#212529' }}
            />
          </div>

          {/* Toggle Mode */}
          <div style={{ display: 'flex', background: '#F1F3F5', borderRadius: '24px', padding: '4px', border: '1px solid #E9ECEF' }}>
            <button 
              onClick={() => { setViewMode('Month'); setSelectedDate(null); }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: viewMode === 'Month' ? '#7B61FF' : 'transparent', 
                color: viewMode === 'Month' ? 'white' : '#495057', 
                border: 'none', padding: '8px 16px', borderRadius: '20px', 
                fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: viewMode === 'Month' ? '0 2px 8px rgba(123, 97, 255, 0.25)' : 'none'
              }}>
              <CalendarIcon size={14} /> Month
            </button>
            <button 
              onClick={() => { setViewMode('Week'); setSelectedDate(null); }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: viewMode === 'Week' ? '#7B61FF' : 'transparent', 
                color: viewMode === 'Week' ? 'white' : '#495057', 
                border: 'none', padding: '8px 16px', borderRadius: '20px', 
                fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: viewMode === 'Week' ? '0 2px 8px rgba(123, 97, 255, 0.25)' : 'none'
              }}>
              <LayoutGrid size={14} /> Week
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Two-Column Layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: '24px', 
        alignItems: 'flex-start' 
      }}>
        
        {/* Left Column: Calendar Component */}
        <div style={{ 
          flex: '1 1 450px', 
          background: 'white', 
          borderRadius: '24px', 
          padding: '24px', 
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)', 
          border: '1px solid #F1F3F5' 
        }}>
          
          {/* Calendar Controller */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#212529' }}>{getHeaderLabel()}</h2>
              <button 
                onClick={handleToday}
                style={{
                  background: '#F1F0FF',
                  color: '#7B61FF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E5E2FF'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F1F0FF'}
              >
                Today
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={handlePrev} 
                style={{ 
                  background: '#F8F9FA', 
                  border: '1px solid #E9ECEF', 
                  borderRadius: '12px', 
                  width: '36px', 
                  height: '36px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E9ECEF'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F8F9FA'}
              >
                <ChevronLeft size={18} color="#495057" />
              </button>
              <button 
                onClick={handleNext} 
                style={{ 
                  background: '#F8F9FA', 
                  border: '1px solid #E9ECEF', 
                  borderRadius: '12px', 
                  width: '36px', 
                  height: '36px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E9ECEF'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F8F9FA'}
              >
                <ChevronRight size={18} color="#495057" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '12px' }}>
            {weekDays.map((day, idx) => (
              <div key={idx} style={{ fontSize: '13px', color: '#868E96', fontWeight: '700', textTransform: 'uppercase', padding: '6px 0' }}>{day}</div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
            {days.map((day, idx) => {
              const isSelected = selectedDate && getLocalDateString(day.fullDate) === getLocalDateString(selectedDate);
              const isToday = getLocalDateString(day.fullDate) === getLocalDateString(new Date());
              const dots = getIndicatorsForDate(day.fullDate);
              
              // Styling states
              let cellBg = 'transparent';
              let textColor = '#212529';
              let border = 'none';

              if (day.isPrevMonth || day.isNextMonth) {
                textColor = '#CED4DA';
              }
              if (isToday) {
                border = '2px solid #7B61FF';
                textColor = '#7B61FF';
              }
              if (isSelected) {
                cellBg = '#7B61FF';
                textColor = 'white';
                border = 'none';
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(isSelected ? null : day.fullDate)}
                  style={{ 
                    height: '52px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: cellBg,
                    borderRadius: '14px',
                    color: textColor,
                    fontWeight: (isSelected || isToday) ? '700' : '600',
                    fontSize: '14px',
                    position: 'relative',
                    cursor: 'pointer',
                    border: border,
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: isSelected ? '0 4px 12px rgba(123, 97, 255, 0.3)' : 'none'
                  }}
                  className="calendar-cell"
                >
                  <span style={{ transform: isSelected ? 'scale(1.05)' : 'none' }}>{day.num}</span>
                  
                  {/* Indicators (Dots) */}
                  {dots.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '6px', 
                      display: 'flex', 
                      gap: '3px',
                      justifyContent: 'center'
                    }}>
                      {dots.map((color, dotIdx) => (
                        <div key={dotIdx} style={{ 
                          width: '5px', 
                          height: '5px', 
                          background: isSelected ? 'white' : color, 
                          borderRadius: '50%' 
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '28px', 
            paddingTop: '20px', 
            borderTop: '1px solid #F1F3F5',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7B61FF' }} /> Active / Registered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} /> Waitlisted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} /> Registration Deadline
            </div>
          </div>

        </div>

        {/* Right Column: Selected Date Agenda Detail Panel */}
        <div style={{ 
          flex: '1 1 320px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          
          {/* Header info */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'white',
            padding: '16px 20px',
            borderRadius: '18px',
            border: '1px solid #F1F3F5',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)'
          }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#212529', marginBottom: '2px' }}>
                {selectedDate ? `Agenda for ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` : `All Upcoming Events`}
              </h3>
              <p style={{ color: '#868E96', fontSize: '12px', fontWeight: '500' }}>
                {selectedDate ? 'Selected Calendar Day' : `${viewMode} View List`}
              </p>
            </div>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                style={{ 
                  background: '#F1F3F5', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={14} color="#495057" />
              </button>
            )}
          </div>

          {/* Agenda Event Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '20px', border: '1px solid #F1F3F5' }}>
                <p style={{ color: '#868E96', fontSize: '14px', fontWeight: '500' }}>Loading events...</p>
              </div>
            ) : agendaEvents.length > 0 ? (
              agendaEvents.map((event, idx) => {
                const startStr = parseToLocalDateString(event.date || event.createdAt);
                const endStr = parseToLocalDateString(event.endDate) || startStr;
                const deadlineStr = parseToLocalDateString(event.registrationDeadline);
                
                const eventStartDateObj = new Date(startStr);
                const displayMonth = eventStartDateObj.toLocaleString('default', { month: 'short' });
                const displayDay = eventStartDateObj.getDate();

                const isDeadlineActive = selectedDate && getLocalDateString(selectedDate) === deadlineStr;
                
                // Color coordination
                const statusColor = isDeadlineActive ? '#EF4444' : (event.registrationStatus === 'Waitlisted' ? '#3B82F6' : '#7B61FF');
                const softBg = isDeadlineActive ? '#FFF5F5' : (event.registrationStatus === 'Waitlisted' ? '#EFF6FF' : '#F8F6FF');

                return (
                  <div 
                    key={event.id || idx} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: '20px', 
                      background: 'white',
                      border: '1px solid #F1F3F5',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(123, 97, 255, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
                    }}
                  >
                    {/* Event Banner Section */}
                    {event.bannerUrl && (
                      <div style={{ width: '100%', height: '110px', position: 'relative', overflow: 'hidden' }}>
                        <img 
                          src={event.bannerUrl} 
                          alt={event.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px', 
                          background: 'rgba(255,255,255,0.95)', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          color: '#212529' 
                        }}>
                          {event.mode || 'Online'}
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <div style={{ padding: '20px', display: 'flex', gap: '16px' }}>
                      {/* Date Indicator Side Block */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: softBg,
                        border: `1px solid ${statusColor}33`,
                        borderRadius: '16px',
                        padding: '12px',
                        minWidth: '60px',
                        height: '64px'
                      }}>
                        <span style={{ fontSize: '11px', color: statusColor, fontWeight: '800', textTransform: 'uppercase' }}>{displayMonth}</span>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A1A', lineHeight: '1' }}>{displayDay}</span>
                      </div>

                      {/* Text details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#212529', lineHeight: '1.4', margin: 0 }}>
                          {event.title}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6C757D', fontSize: '12px', fontWeight: '500' }}>
                            <Clock size={12} color="#868E96" />
                            <span>{event.startTime || '09:00'} - {event.endTime || '17:00'}</span>
                          </div>
                          {event.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6C757D', fontSize: '12px', fontWeight: '500' }}>
                              <MapPin size={12} color="#868E96" />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Badges Container */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {event.category && (
                            <span style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: `${getCategoryColor(event.category)}15`, color: getCategoryColor(event.category), 
                              padding: '4px 8px', borderRadius: '8px', 
                              fontSize: '11px', fontWeight: '700' 
                            }}>
                              {event.category}
                            </span>
                          )}
                          {isDeadlineActive ? (
                            <span style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px',
                              background: '#FFF0F0', color: '#EF4444', 
                              padding: '4px 8px', borderRadius: '8px', 
                              fontSize: '11px', fontWeight: '700' 
                            }}>
                              <AlertTriangle size={11} /> Registration Deadline
                            </span>
                          ) : (
                            <>
                              <span style={{ 
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: '#F3F0FF', color: '#7B61FF', 
                                padding: '4px 8px', borderRadius: '8px', 
                                fontSize: '11px', fontWeight: '700' 
                              }}>
                                <CheckSquare size={11} /> {event.registrationStatus || 'Registered'}
                              </span>
                              {event.status === 'Completed' && (
                                <span style={{ 
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  background: '#E6FCF5', color: '#0CA678', 
                                  padding: '4px 8px', borderRadius: '8px', 
                                  fontSize: '11px', fontWeight: '700' 
                                }}>
                                  <CheckCircle size={11} /> Completed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation actions Footer */}
                    <div style={{ 
                      display: 'flex', 
                      borderTop: '1px solid #F1F3F5', 
                      background: '#FAFAFB',
                      padding: '12px 20px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button 
                        onClick={() => addToGoogleCalendar(event)}
                        style={{
                          background: 'none',
                          color: '#495057',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'underline',
                          padding: '0'
                        }}
                      >
                        <CalendarIcon size={12} /> Add to Calendar
                      </button>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => navigate(`/event/${event.id}/timeline`)}
                          style={{
                            background: 'white',
                            color: '#495057',
                          border: '1px solid #CED4DA',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#F1F3F5'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <CalendarDays size={12} /> Timeline
                      </button>
                      <button 
                        onClick={() => navigate(`/event/${event.id}`)}
                        style={{
                          background: '#7B61FF',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'background 0.2s',
                          boxShadow: '0 2px 6px rgba(123, 97, 255, 0.15)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#694EE6'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#7B61FF'}
                      >
                        Details <ExternalLink size={12} />
                      </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Empty state details */
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px', 
                background: 'white', 
                borderRadius: '20px', 
                border: '1px solid #F1F3F5',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  background: '#F8F6FF', 
                  borderRadius: '50%', 
                  width: '48px', 
                  height: '48px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CalendarRange size={24} color="#7B61FF" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#212529', margin: 0 }}>No Scheduled Events</h4>
                <p style={{ color: '#868E96', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  There are no assessments or event deadlines recorded for this date.
                </p>
                <button 
                  onClick={() => navigate('/explore')}
                  style={{
                    background: '#F1F0FF',
                    color: '#7B61FF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#7B61FF';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#F1F0FF';
                    e.currentTarget.style.color = '#7B61FF';
                  }}
                >
                  <Compass size={14} /> Browse Assessments
                </button>
              </div>
            )}
          </div>
          
        </div>

      </div>

    </div>
  );
}
