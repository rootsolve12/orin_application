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
  CalendarDays,
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRegistrations, getEventRegistration } from '../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { seedEventsOnce } from '../utils/seedEvents';

export default function MyEvents() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('Month'); // 'Month' | 'Week'
  const [loading, setLoading] = useState(true);

  // Calendar structure helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fallback Mock Registrations if Firestore is fully empty
  const MOCK_REGISTRATIONS = [
    {
      id: 'mock1',
      title: 'Web3 Security Workshop',
      date: new Date(Date.now() + 5 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      registrationDeadline: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Virtual Zoom Room',
      startTime: '10:00',
      endTime: '12:00',
      mode: 'Online',
      currentRoundIndex: 1,
      rounds: ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Shortlisting', 'Final', 'Results', 'Certification']
    },
    {
      id: 'mock2',
      title: 'Solidity Advanced Assessment',
      date: new Date(Date.now() + 12 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      registrationDeadline: new Date(Date.now() + 8 * 86400000).toISOString(),
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Assessment Portal',
      startTime: '14:00',
      endTime: '16:00',
      mode: 'Online',
      currentRoundIndex: 2,
      rounds: ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Shortlisting', 'Final', 'Results', 'Certification']
    },
    {
      id: 'mock3',
      title: 'Orin Community Hackathon',
      date: new Date(Date.now() + 20 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 23 * 86400000).toISOString(),
      registrationDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'Active',
      registrationStatus: 'Approved',
      location: 'Main Auditorium & GitHub',
      startTime: '09:00',
      endTime: '18:00',
      mode: 'Hybrid',
      currentRoundIndex: 0,
      rounds: ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Shortlisting', 'Final', 'Results', 'Certification']
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

  // Add days helper
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    return getLocalDateString(d);
  };

  useEffect(() => {
    const fetchRegs = async () => {
      if (currentUser) {
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

  // Dynamic Academic Activities Generator (color-coded)
  const getActivities = (events) => {
    const list = [];
    events.forEach(e => {
      const eventStartStr = parseToLocalDateString(e.date || e.createdAt);
      const eventEndStr = parseToLocalDateString(e.endDate) || eventStartStr;
      const regDeadlineStr = parseToLocalDateString(e.registrationDeadline) || addDays(eventStartStr, -4);

      // 1. Registered Event (Purple: #7B61FF)
      list.push({
        id: `${e.id}_event`,
        eventId: e.id,
        eventTitle: e.title,
        title: e.title,
        type: 'event',
        date: eventStartStr,
        time: `${e.startTime || '09:00'} - ${e.endTime || '17:00'}`,
        color: '#7B61FF',
        colorName: 'purple',
        location: e.location || 'Online',
        stage: e.rounds?.[e.currentRoundIndex || 0] || 'Registration',
        progress: e.currentRoundIndex || 0,
        totalRounds: e.rounds?.length || 9,
        nextAction: 'Participate in main event activities',
        originalEvent: e
      });

      // 2. Assessment (Blue: #3B82F6)
      list.push({
        id: `${e.id}_assessment`,
        eventId: e.id,
        eventTitle: e.title,
        title: `${e.title} - Online Coding Assessment`,
        type: 'assessment',
        date: addDays(regDeadlineStr, 1) || addDays(eventStartStr, -2),
        time: '14:00 - 15:00',
        color: '#3B82F6',
        colorName: 'blue',
        location: 'Orin Code Sandbox Portal',
        stage: 'Assessment',
        progress: 2,
        totalRounds: 9,
        nextAction: 'Take Timed MCQ Screening',
        originalEvent: e
      });

      // 3. Submission Deadline (Orange: #F59E0B)
      list.push({
        id: `${e.id}_submission`,
        eventId: e.id,
        eventTitle: e.title,
        title: `${e.title} - Project Workspace Submission`,
        type: 'submission',
        date: addDays(eventStartStr, -1),
        time: 'Before 23:59',
        color: '#F59E0B',
        colorName: 'orange',
        location: 'Orin Submission Vault',
        stage: 'Submission',
        progress: 3,
        totalRounds: 9,
        nextAction: 'Submit Project Repository URL',
        originalEvent: e
      });

      // 4. Interviews & Presentation Rounds (Red: #EF4444)
      list.push({
        id: `${e.id}_critical`,
        eventId: e.id,
        eventTitle: e.title,
        title: `${e.title} - Final Live Pitch Presentation`,
        type: 'critical',
        date: eventStartStr,
        time: '11:00 - 12:30',
        color: '#EF4444',
        colorName: 'red',
        location: 'Orin Panel Room Zoom',
        stage: 'Final',
        progress: 6,
        totalRounds: 9,
        nextAction: 'Join Live Panel Pitch Room',
        originalEvent: e
      });

      // 5. Result Announcement (Green: #10B981)
      list.push({
        id: `${e.id}_result`,
        eventId: e.id,
        eventTitle: e.title,
        title: `${e.title} - Winners & Results Announcement`,
        type: 'result',
        date: eventEndStr,
        time: '18:00',
        color: '#10B981',
        colorName: 'green',
        location: 'Orin Winners Circle Feed',
        stage: 'Results',
        progress: 7,
        totalRounds: 9,
        nextAction: 'Check Winner Standings',
        originalEvent: e
      });

      // 6. Certificate Release (Gold: #EAB308)
      list.push({
        id: `${e.id}_certificate`,
        eventId: e.id,
        eventTitle: e.title,
        title: `${e.title} - Credential Minting & Release`,
        type: 'certificate',
        date: addDays(eventEndStr, 2),
        time: '09:00 onwards',
        color: '#EAB308',
        colorName: 'gold',
        location: 'Orin Certificates Tab',
        stage: 'Certification',
        progress: 8,
        totalRounds: 9,
        nextAction: 'Mint & Claim Digital Certificate',
        originalEvent: e
      });
    });
    return list;
  };

  const allActivities = getActivities(activeEvents);

  // Filter activities based on calendar grid navigation and searches
  const getAgendaActivities = () => {
    let list = allActivities;
    
    if (searchQuery) {
      list = list.filter(act => 
        act.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      const selStr = getLocalDateString(selectedDate);
      return list.filter(act => act.date === selStr);
    }

    // Fallback: list of upcoming events in the currently viewed month or week
    return list.filter(act => {
      const d = new Date(act.date);
      if (isNaN(d.getTime())) return false;
      
      if (viewMode === 'Month') {
        return d.getFullYear() === year && d.getMonth() === month;
      } else {
        const dayOfWeek = currentDate.getDay();
        const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
        const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
        return d >= sunday && d <= saturday;
      }
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const agendaActivities = getAgendaActivities();

  // Weekly Overview Widget Calculator
  const getWeeklyOverview = () => {
    const dayOfWeek = currentDate.getDay();
    const sunday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
    const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    sunday.setHours(0, 0, 0, 0);

    const weekActs = allActivities.filter(act => {
      const d = new Date(act.date);
      return d >= sunday && d <= saturday;
    });

    const activeEvents = weekActs.filter(a => a.type === 'event');
    const upcomingAssessments = weekActs.filter(a => a.type === 'assessment');
    const pendingSubmissions = weekActs.filter(a => a.type === 'submission');
    const upcomingDeadlines = weekActs.filter(a => a.type === 'critical');

    return {
      activeEvents,
      upcomingAssessments,
      pendingSubmissions,
      upcomingDeadlines
    };
  };

  const weekly = getWeeklyOverview();

  // Today's Priorities Calculator
  const getPriorities = () => {
    const todayStr = getLocalDateString(new Date());
    const tomorrowStr = getLocalDateString(new Date(Date.now() + 86400000));
    
    return allActivities.filter(act => {
      const isUrgentType = ['assessment', 'submission', 'critical'].includes(act.type);
      const isUrgentDate = act.date === todayStr || act.date === tomorrowStr;
      return isUrgentType && isUrgentDate;
    }).sort((a, b) => {
      const weights = { critical: 3, submission: 2, assessment: 1 };
      return (weights[b.type] || 0) - (weights[a.type] || 0);
    });
  };

  const priorities = getPriorities();

  // Countdown Helper
  const getCountdownText = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return '';
  };

  // Google Calendar Integration
  const addToGoogleCalendar = (activity) => {
    const dateStr = activity.date.replace(/-/g, '');
    const startTimeStr = activity.time.split(' - ')[0]?.replace(/:/g, '').substring(0, 4) || '0900';
    const endTimeStr = activity.time.split(' - ')[1]?.replace(/:/g, '').substring(0, 4) || '1700';
    const start = `${dateStr}T${startTimeStr}00Z`;
    const end = `${dateStr}T${endTimeStr}00Z`;
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.title)}&dates=${start}/${end}&details=${encodeURIComponent(`Event Stage: ${activity.stage}. Required Action: ${activity.nextAction}`)}&location=${encodeURIComponent(activity.location)}`;
    window.open(url, '_blank');
  };

  // ICS Export Creator
  const exportToICS = () => {
    const calendarHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Orin Platform//Academic Planner//EN',
      'CALSCALE:GREGORIAN'
    ];
    const calendarFooter = ['END:VCALENDAR'];
    
    const events = allActivities.map(act => {
      const dateStr = act.date.replace(/-/g, '');
      const startTimeStr = act.time.split(' - ')[0]?.replace(/:/g, '').substring(0, 4) || '0900';
      const endTimeStr = act.time.split(' - ')[1]?.replace(/:/g, '').substring(0, 4) || '1700';
      
      const uid = `${act.id}@orin.com`;
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dateStr}T${startTimeStr}00Z`,
        `DTEND:${dateStr}T${endTimeStr}00Z`,
        `SUMMARY:${act.title}`,
        `DESCRIPTION:${act.eventTitle} - ${act.stage}`,
        `LOCATION:${act.location || 'Online'}`,
        'END:VEVENT'
      ].join('\r\n');
    });

    const fileContent = [...calendarHeader, ...events, ...calendarFooter].join('\r\n');
    const blob = new Blob([fileContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orin_academic_planner.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Navigation handlers
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



  const getMonthDays = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const daysList = [];
    for (let i = 0; i < firstDayIndex; i++) {
      const num = daysInPrevMonth - firstDayIndex + i + 1;
      daysList.push({
        num,
        isPrevMonth: true,
        fullDate: new Date(year, month - 1, num)
      });
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      daysList.push({
        num: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i)
      });
    }
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

  const getIndicatorsForDate = (cellDate) => {
    const cellStr = getLocalDateString(cellDate);
    const dayActs = allActivities.filter(act => act.date === cellStr);
    
    const colors = [];
    dayActs.forEach(act => {
      if (!colors.includes(act.color)) {
        colors.push(act.color);
      }
    });

    const colorOrder = {
      '#7B61FF': 1, // purple
      '#3B82F6': 2, // blue
      '#F59E0B': 3, // orange
      '#EF4444': 4, // red
      '#10B981': 5, // green
      '#EAB308': 6  // gold
    };
    colors.sort((a, b) => (colorOrder[a] || 9) - (colorOrder[b] || 9));
    return colors;
  };

  const mapRoundToStage = (roundName) => {
    if (!roundName) return 'Registration';
    const r = roundName.toLowerCase();
    if (r.includes('register') || r.includes('screen')) return 'Registration';
    if (r.includes('assess')) return 'Assessment';
    if (r.includes('submit') || r.includes('project')) return 'Submission';
    if (r.includes('review') || r.includes('shortlist') || r.includes('judge')) return 'Review';
    if (r.includes('final') || r.includes('result') || r.includes('winner')) return 'Results';
    if (r.includes('certif')) return 'Certification';
    return 'Registration';
  };

  const getStageStepInfo = (stageName) => {
    const stages = ['Registration', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'];
    const mapped = mapRoundToStage(stageName);
    const idx = stages.indexOf(mapped);
    const step = idx === -1 ? 1 : idx + 1;
    return {
      step,
      total: 6,
      stageLabel: mapped
    };
  };

  // Stepper UI Renderer for Cards
  const renderCardTimeline = (currentStageName) => {
    const stages = ['Registration', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'];
    const mapped = mapRoundToStage(currentStageName);
    const activeIdx = stages.indexOf(mapped);
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 6px', position: 'relative', padding: '0 8px' }}>
        <div style={{ position: 'absolute', left: '16px', right: '16px', top: '10px', height: '2px', background: '#E9ECEF', zIndex: 0 }} />
        {stages.map((st, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx || (activeIdx === -1 && idx === 0);
          
          let circleBg = '#E9ECEF';
          let border = '2px solid white';
          
          if (isDone) circleBg = '#10B981';
          if (isCurrent) {
            circleBg = '#7B61FF';
          }
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                background: circleBg, 
                border: border, 
                boxShadow: isCurrent ? '0 0 0 3px rgba(123,97,255,0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} />
              <span style={{ 
                fontSize: '9px', 
                fontWeight: (isCurrent || isDone) ? '700' : '500', 
                color: isCurrent ? '#7B61FF' : (isDone ? '#10B981' : '#868E96'), 
                marginTop: '4px',
                transform: 'scale(0.85)'
              }}>{st.substring(0, 5)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1000px', 
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
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px', letterSpacing: '-0.5px' }}>Academic Calendar</h1>
          <p style={{ color: '#6C757D', fontSize: '14px' }}>Track your scheduled events, assessments, and deadlines</p>
        </div>
        
        {/* Actions Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '24px', padding: '8px 16px', border: '1px solid #E9ECEF', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <Search size={16} color="#868E96" />
            <input 
              type="text"
              placeholder="Search calendar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: '8px', fontSize: '13px', width: '150px', color: '#212529' }}
            />
          </div>

          {/* Export to ICS button */}
          <button 
            onClick={exportToICS}
            style={{
              background: '#FFF9DB',
              color: '#EAB308',
              border: '1px solid #FFE066',
              borderRadius: '24px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#EAB308';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FFF9DB';
              e.currentTarget.style.color = '#EAB308';
            }}
          >
            <CalendarIcon size={14} /> Export Calendar (.ICS)
          </button>

          {/* Toggle View Mode */}
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

      {/* 1. Weekly Overview Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Card: Active Events */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E9ECEF', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Events</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7B61FF' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>{weekly.activeEvents.length}</span>
            <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>this week</span>
          </div>
        </div>

        {/* Card: Upcoming Assessments */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E9ECEF', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessments</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>{weekly.upcomingAssessments.length}</span>
            <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>due</span>
          </div>
        </div>

        {/* Card: Pending Submissions */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E9ECEF', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submissions</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>{weekly.pendingSubmissions.length}</span>
            <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>pending</span>
          </div>
        </div>

        {/* Card: Upcoming Deadlines */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E9ECEF', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical Deadlines</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>{weekly.upcomingDeadlines.length}</span>
            <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>urgent</span>
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
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
          
          {/* Calendar Navigation Controller */}
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
                onMouseOver={(e) => (e.currentTarget.style.background = '#E5E2FF')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#F1F0FF')}
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
                onMouseOver={(e) => (e.currentTarget.style.background = '#E9ECEF')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#F8F9FA')}
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
                onMouseOver={(e) => (e.currentTarget.style.background = '#E9ECEF')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#F8F9FA')}
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
                  
                  {/* Color Legend Styled Indicators */}
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

          {/* Color Legend (6 colors) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            marginTop: '28px', 
            paddingTop: '20px', 
            borderTop: '1px solid #F1F3F5',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7B61FF' }} /> Purple: Registered Events
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} /> Blue: Assessments
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} /> Orange: Submissions
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} /> Red: Critical Deadlines
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> Green: Results
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#495057' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EAB308' }} /> Gold: Certificates
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
                {selectedDate ? `Planner for ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` : `All Upcoming Planner Items`}
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

          {/* 2. Today's Priorities Section */}
          {priorities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> Today's Priorities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {priorities.map((pri) => (
                  <div key={pri.id} style={{ 
                    background: 'white',
                    borderLeft: `4px solid ${pri.color}`,
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.04)',
                    border: '1px solid #F1F3F5',
                    borderLeftWidth: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>{pri.title}</span>
                      <span style={{ fontSize: '10px', background: `${pri.color}15`, color: pri.color, padding: '2px 6px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {getCountdownText(pri.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>Action: {pri.nextAction}</span>
                      <button 
                        onClick={() => navigate(`/event/${pri.eventId}/timeline`)}
                        style={{ background: pri.color, color: 'white', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Action Center
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agenda Activity Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '4px 0 0 0' }}>
              Academic Planner Schedule
            </h4>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '20px', border: '1px solid #F1F3F5' }}>
                <p style={{ color: '#868E96', fontSize: '14px', fontWeight: '500' }}>Loading planner items...</p>
              </div>
            ) : agendaActivities.length > 0 ? (
              agendaActivities.map((act) => {
                const actDateObj = new Date(act.date);
                const displayMonth = actDateObj.toLocaleString('default', { month: 'short' });
                const displayDay = actDateObj.getDate();
                const countdown = getCountdownText(act.date);

                return (
                  <div 
                    key={act.id} 
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
                    {/* Content Section */}
                    <div style={{ padding: '20px', display: 'flex', gap: '16px' }}>
                      
                      {/* Date Indicator Side Block */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: `${act.color}10`,
                        border: `1px solid ${act.color}33`,
                        borderRadius: '16px',
                        padding: '12px',
                        minWidth: '60px',
                        height: '64px'
                      }}>
                        <span style={{ fontSize: '11px', color: act.color, fontWeight: '800', textTransform: 'uppercase' }}>{displayMonth}</span>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A1A', lineHeight: '1' }}>{displayDay}</span>
                      </div>

                      {/* Text details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#212529', lineHeight: '1.4', margin: 0 }}>
                            {act.title}
                          </h4>
                          {countdown && (
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: '800', 
                              background: countdown === 'Today' ? '#FFF5F5' : '#F1F3F5',
                              color: countdown === 'Today' ? '#EF4444' : '#6C757D',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap'
                            }}>
                              {countdown}
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6C757D', fontSize: '12px', fontWeight: '500' }}>
                            <Clock size={12} color="#868E96" />
                            <span>{act.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6C757D', fontSize: '12px', fontWeight: '500' }}>
                            <MapPin size={12} color="#868E96" />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{act.location}</span>
                          </div>
                        </div>

                        {/* Visual Stage Progress Stepper */}
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#868E96', marginBottom: '4px' }}>
                            <span>Stage: {act.stage}</span>
                            <span>Step {getStageStepInfo(act.stage).step} of 6</span>
                          </div>
                          
                          {/* Mini Stepper Timeline visualization */}
                          {renderCardTimeline(act.stage)}
                        </div>

                        {/* Action Badge */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          <span style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: `${act.color}15`, color: act.color, 
                            padding: '4px 8px', borderRadius: '8px', 
                            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'
                          }}>
                            {act.type}
                          </span>
                          <span style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: '#F1F0FF', color: '#7B61FF', 
                            padding: '4px 8px', borderRadius: '8px', 
                            fontSize: '11px', fontWeight: '700' 
                          }}>
                            Action Required: {act.nextAction}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Sync & Steer Actions Footer */}
                    <div style={{ 
                      display: 'flex', 
                      borderTop: '1px solid #F1F3F5', 
                      background: '#FAFAFB',
                      padding: '12px 20px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button 
                        onClick={() => addToGoogleCalendar(act)}
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
                        <CalendarIcon size={12} /> Add to Google Calendar
                      </button>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => navigate(`/event/${act.eventId}/timeline`)}
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
                          onMouseOver={(e) => (e.currentTarget.style.background = '#F1F3F5')}
                          onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                        >
                          <CalendarDays size={12} /> Timeline
                        </button>
                        <button 
                          onClick={() => navigate(`/event/${act.eventId}`)}
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
                          onMouseOver={(e) => (e.currentTarget.style.background = '#694EE6')}
                          onMouseOut={(e) => (e.currentTarget.style.background = '#7B61FF')}
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
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#212529', margin: 0 }}>No Scheduled Activities</h4>
                <p style={{ color: '#868E96', fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  There are no assessments, submissions or event deadlines matching this search or date.
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
                  <Compass size={14} /> Browse Opportunities
                </button>
              </div>
            )}
          </div>
          
        </div>

      </div>

    </div>
  );
}
