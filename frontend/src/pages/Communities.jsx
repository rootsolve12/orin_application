import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Globe, Users, Send, Hash, Plus, MessageSquare, 
  Lock, Sparkles, ArrowRight, Info, X, ShieldAlert, Award, 
  FileText, Link2, Calendar, Target, PlusCircle, Volume2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCommunities, 
  joinCommunity, 
  leaveCommunity, 
  sendCommunityMessage, 
  subscribeToCommunityMessages,
  createCommunity,
  getAllEvents
} from '../firebase/firestore';

export default function Communities() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  
  // Data States
  const [communitiesList, setCommunitiesList] = useState([]);
  const [selectedComm, setSelectedComm] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Tabs and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('Discussions'); // Discussions, About, Announcements, Resources, Events, Members, Team Board, Leaderboard

  // Form input states for creating a new community
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommTag, setNewCommTag] = useState('Interest');

  // Interactive Form States for resources/teams/announcements
  const [chatMessage, setChatMessage] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState('Link');
  
  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [teamSpots, setTeamSpots] = useState(1);
  const [teamDesc, setTeamDesc] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');

  // UI Status
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Chat scroll Ref
  const chatBottomRef = useRef(null);

  // Fallback Mock Data if Firestore is empty
  const MOCK_COMMUNITIES = [
    {
      title: 'AI/ML Enthusiasts',
      description: 'A community for students passionate about Artificial Intelligence, Machine Learning, and Deep Learning research.',
      membersCount: 1250,
      tag: 'Interest',
      memberIds: []
    },
    {
      title: 'Competitive Programming Club',
      description: 'Discuss algorithms, share contest solutions, and prepare for ICPC, Google Kick Start, and Codeforces matches.',
      membersCount: 890,
      tag: 'Interest',
      memberIds: []
    },
    {
      title: 'Valkyrie Devs Team Space',
      description: 'Official workspace and interest group for front-end architecture and full-stack engineering patterns.',
      membersCount: 342,
      tag: 'Technical',
      memberIds: []
    },
    {
      title: 'Startup & Innovation Network',
      description: 'Connect with aspiring student entrepreneurs, share pitch decks, and find technical co-founders.',
      membersCount: 670,
      tag: 'Interest',
      memberIds: []
    }
  ];

  // Enriched local lists to keep resource/announcement inputs alive per-session
  const [localAnnouncements, setLocalAnnouncements] = useState({});
  const [localResources, setLocalResources] = useState({});
  const [localTeamPosts, setLocalTeamPosts] = useState({});

  // 1. Load communities and automatically sync with Firestore & Events
  useEffect(() => {
    const fetchCommsAndEvents = async () => {
      setLoading(true);
      try {
        const [comms, events] = await Promise.all([
          getCommunities(),
          getAllEvents()
        ]);
        
        let currentComms = [...comms];

        // 10. Automatically create an Event-based Community for every event if missing
        const eventCommIds = new Set(currentComms.filter(c => c.tag === 'Event Specific').map(c => c.eventId));
        let createdAny = false;

        await Promise.all(events.map(async (event) => {
          if (!eventCommIds.has(event.id)) {
            const newComm = {
              title: `${event.title} Hub`,
              description: `Official group for registered participants of ${event.title}. Discuss stages, project submissions, and collaborate on teams here.`,
              tag: 'Event Specific',
              eventId: event.id,
              memberIds: [],
              membersCount: event.registeredCount || 1
            };
            await createCommunity(newComm);
            createdAny = true;
          }
        }));

        if (createdAny) {
          currentComms = await getCommunities();
        }

        if (currentComms.length === 0) {
          // Initialize firestore with standard mocks if fully empty
          await Promise.all(MOCK_COMMUNITIES.map(async (mock) => {
            await createCommunity(mock);
          }));
          currentComms = await getCommunities();
        }

        setCommunitiesList(currentComms);
        if (currentComms.length > 0 && !selectedComm) {
          setSelectedComm(currentComms[0]);
        }
      } catch (err) {
        console.error("Error loading communities and events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommsAndEvents();
  }, [refreshKey]);

  // Check enrollment/membership status
  const checkJoined = (comm) => {
    if (!currentUser) return false;
    const isJoined = (userProfile?.joinedCommunities || []).includes(comm.id);
    
    // Auto-enroll registered participants for event-specific communities
    if (comm.tag === 'Event Specific' && comm.eventId) {
      const isRegistered = (userProfile?.registeredEvents || []).includes(comm.eventId);
      if (isRegistered) return true;
    }
    return isJoined;
  };

  // 2. Real-time community messages sync
  useEffect(() => {
    if (!selectedComm?.id) return;
    
    const isJoined = checkJoined(selectedComm);
    if (!isJoined) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToCommunityMessages(selectedComm.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [selectedComm?.id, userProfile?.joinedCommunities]);

  // 3. Join Community Operation
  const handleJoin = async (comm) => {
    if (!currentUser) return;
    try {
      await joinCommunity(currentUser.uid, comm.id);
      await refreshProfile();
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Leave Community Operation
  const handleLeave = async (comm) => {
    if (!currentUser) return;
    try {
      await leaveCommunity(currentUser.uid, comm.id);
      await refreshProfile();
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Create Community Operation
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommName.trim() || !newCommDesc.trim()) return;
    try {
      const commData = {
        title: newCommName,
        description: newCommDesc,
        tag: newCommTag,
        memberIds: [currentUser.uid],
        membersCount: 1
      };
      const newCommId = await createCommunity(commData);
      await refreshProfile();
      setShowCreateModal(false);
      setNewCommName('');
      setNewCommDesc('');
      
      // Auto-select the newly created community
      setSelectedComm({
        id: newCommId,
        ...commData
      });
      
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Send Message Operation
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedComm?.id) return;
    const textToSend = chatMessage;
    setChatMessage('');
    setIsSending(true);
    try {
      await sendCommunityMessage(
        selectedComm.id, 
        currentUser.uid, 
        userProfile?.displayName || currentUser?.displayName || 'Anonymous', 
        textToSend
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Add Resource to local Hub
  const handleAddResource = (e) => {
    e.preventDefault();
    if (!resourceName || !resourceUrl) return;
    const newRes = {
      id: `r_${Date.now()}`,
      name: resourceName,
      url: resourceUrl,
      type: resourceType,
      sharedBy: userProfile?.displayName || 'Student'
    };
    setLocalResources(prev => ({
      ...prev,
      [selectedComm.id]: [newRes, ...(prev[selectedComm.id] || [])]
    }));
    setResourceName('');
    setResourceUrl('');
  };

  // Add Announcement to local Hub
  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (!annTitle || !annText) return;
    const newAnn = {
      id: `a_${Date.now()}`,
      title: annTitle,
      text: annText,
      date: 'Just now',
      author: 'Moderator'
    };
    setLocalAnnouncements(prev => ({
      ...prev,
      [selectedComm.id]: [newAnn, ...(prev[selectedComm.id] || [])]
    }));
    setAnnTitle('');
    setAnnText('');
  };

  // Add Team to local board
  const handleAddTeamPost = (e) => {
    e.preventDefault();
    if (!teamName || !teamRole || !teamDesc) return;
    const newTeam = {
      id: `t_${Date.now()}`,
      teamName,
      roleNeeded: teamRole,
      spotsLeft: Number(teamSpots),
      description: teamDesc
    };
    setLocalTeamPosts(prev => ({
      ...prev,
      [selectedComm.id]: [newTeam, ...(prev[selectedComm.id] || [])]
    }));
    setTeamName('');
    setTeamRole('');
    setTeamSpots(1);
    setTeamDesc('');
  };

  // Generate enriched metadata dynamically for Dashboard tabs
  const getEnrichedData = (comm) => {
    if (!comm) return null;
    const nameSum = comm.title ? comm.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 100;
    const postsCount = 15 + (nameSum % 45);
    const onlineCount = 4 + (nameSum % 15);

    // Initial base lists
    const baseAnnouncements = [
      { id: 'a1', title: 'Welcome to Orin Community! 🎉', text: `Welcome everyone to the official #${comm.title} community hub. Use this platform to network and share insights.`, date: '3 days ago', author: 'System Bot' }
    ];

    const baseResources = [
      { id: 'r1', name: 'Reference Reading Guidelines', url: 'https://docs.orin.platform', type: 'Link', sharedBy: 'Sarah' }
    ];

    const baseTeamPosts = [
      { id: 't1', teamName: 'DataBros', roleNeeded: 'Frontend Dev', spotsLeft: 1, description: 'Collaborating on the Orin student dashboard. Experience with React needed.' }
    ];

    const leaderboard = [
      { rank: 1, name: 'Sarah Chen', points: '1,250 XP', badge: '🥇' },
      { rank: 2, name: 'Alex M.', points: '980 XP', badge: '🥈' },
      { rank: 3, name: 'David K.', points: '840 XP', badge: '🥉' }
    ];

    const members = [
      { name: 'Sarah Chen', status: 'Online' },
      { name: 'Alex M.', status: 'Away' },
      { name: 'David K.', status: 'Offline' }
    ];

    return {
      ...comm,
      weeklyActivity: `${postsCount} posts/week`,
      onlineCount: `${onlineCount} online`,
      announcements: [...(localAnnouncements[comm.id] || []), ...baseAnnouncements],
      resources: [...(localResources[comm.id] || []), ...baseResources],
      teamPosts: [...(localTeamPosts[comm.id] || []), ...baseTeamPosts],
      leaderboard,
      members
    };
  };

  const enrichedSelected = getEnrichedData(selectedComm);

  // Filters
  const filteredCommunities = communitiesList.filter(comm => {
    const matchesSearch = comm.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          comm.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || comm.tag === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px', color: 'var(--text-light)', background: 'var(--bg-light)', minHeight: '100vh' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="heading-1" style={{ margin: 0 }}>Student Collaboration Ecosystem</h1>
          <p className="text-muted" style={{ marginTop: '6px', margin: 0 }}>Connect with event-specific hubs, form teams, share materials, and collaborate in real-time.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
        >
          <Plus size={16} /> Create Community Group
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Browse Communities, Categories & Trends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Search bar */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
            <Search size={18} color="var(--muted-light)" />
            <input 
              type="text" 
              placeholder="Search community hubs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 8px', fontSize: '14px', outline: 'none', color: 'var(--text-light)' }} 
            />
          </div>

          {/* 4. Community Categories Selection Grid */}
          <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Community Categories</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['All', 'Interest', 'Technical', 'Event Specific'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? 'var(--primary)' : 'var(--bg-light)',
                    color: activeCategory === cat ? 'white' : 'var(--text-light)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Trending Topics Widget */}
          <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Trending Discussions</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['#rust-lifetime-tips', '#ai-agent-frameworks', '#react-19-hooks', '#solidity-ctf-hints', '#figma-wireframes', '#scholarship-portals'].map(hash => (
                <span 
                  key={hash}
                  onClick={() => setSearchQuery(hash)}
                  style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}
                >
                  {hash}
                </span>
              ))}
            </div>
          </div>

          {/* Communities List grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', pr: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '700', textTransform: 'uppercase' }}>Community Channels ({filteredCommunities.length})</span>
            {filteredCommunities.map((comm) => {
              const isJoined = checkJoined(comm);
              const isSelected = selectedComm?.id === comm.id;
              const isPopular = comm.membersCount > 500;
              const isEventSpecific = comm.tag === 'Event Specific';

              const enrichedInfo = getEnrichedData(comm);

              return (
                <div 
                  key={comm.id} 
                  onClick={() => { setSelectedComm(comm); setActiveTab('Discussions'); }}
                  style={{ 
                    background: 'var(--surface)', 
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)', 
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(123, 97, 255, 0.05)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: isSelected ? 'var(--primary)' : 'var(--text-light)', margin: 0 }}>
                          {comm.title}
                        </h3>
                        {isPopular && (
                          <span style={{ background: 'rgba(255, 138, 0, 0.1)', color: '#FF8A00', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>POPULAR</span>
                        )}
                        {isEventSpecific && (
                          <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00B8D9', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>EVENT SPECIFIC</span>
                        )}
                      </div>
                      <span style={{ 
                        background: 'var(--bg-light)', color: 'var(--muted-light)', fontSize: '10px', 
                        fontWeight: '800', padding: '2px 8px', borderRadius: '8px', 
                        textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' 
                      }}>
                        {comm.tag}
                      </span>
                    </div>
                    
                    {isJoined ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLeave(comm); }} 
                        style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--muted-light)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Leave
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleJoin(comm); }} 
                        style={{ background: 'rgba(123, 97, 255, 0.1)', border: 'none', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Join
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--muted-light)', fontSize: '13px', lineHeight: '1.4', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {comm.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--muted-light)', fontSize: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} />
                      <span>{comm.membersCount || 1} Members</span>
                    </div>
                    <div>•</div>
                    <div style={{ color: 'var(--primary)', fontWeight: '600' }}>{enrichedInfo.weeklyActivity}</div>
                    <div>•</div>
                    <div style={{ color: '#00C853', fontWeight: '600' }}>{enrichedInfo.onlineCount}</div>
                  </div>
                </div>
              );
            })}
            {filteredCommunities.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No community hubs found.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Community Collaboration Dashboard */}
        <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '680px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {selectedComm ? (
            (() => {
              const isJoined = checkJoined(selectedComm);
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Dashboard Header Banner */}
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>
                          #{selectedComm.title} Dashboard
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginTop: '4px', margin: 0 }}>{selectedComm.description}</p>
                      </div>
                      <span style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
                        {selectedComm.tag}
                      </span>
                    </div>

                    {/* Dashboard Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '20px', scrollbarWidth: 'none' }}>
                      {['Discussions', 'About', 'Announcements', 'Resources', 'Team Board', 'Leaderboard', 'Members'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            background: activeTab === tab ? 'var(--primary)' : 'var(--bg-light)',
                            color: activeTab === tab ? 'white' : 'var(--text-light)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '16px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dashboard View Routing Panels */}
                  <div style={{ flex: 1, overflowY: 'auto', background: '#FAF9FA', padding: '24px' }}>
                    
                    {/* TAB 1: Discussions (Live Chat Guard) */}
                    {activeTab === 'Discussions' && (
                      isJoined ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ textAlign: 'center', color: 'var(--muted-light)', fontSize: '12px' }}>
                              👋 Welcome to #{selectedComm.title} live forum. Maintain professional collaboration!
                            </div>
                            
                            {messages.map((msg, idx) => {
                              const isMe = msg.userId === currentUser.uid;
                              return (
                                <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                  <span style={{ fontSize: '10px', color: 'var(--muted-light)', marginBottom: '2px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                                    <strong>{msg.displayName}</strong> &bull; {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                  </span>
                                  <div style={{ 
                                    background: isMe ? 'var(--primary)' : 'var(--surface)', 
                                    color: isMe ? 'white' : 'var(--text-light)', 
                                    padding: '10px 14px', 
                                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                    fontSize: '13px',
                                    border: isMe ? 'none' : '1px solid var(--border-light)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                    wordBreak: 'break-word'
                                  }}>
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatBottomRef} />
                          </div>

                          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '6px 14px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                            <input 
                              placeholder={`Message #${selectedComm.title}...`}
                              value={chatMessage} 
                              onChange={e => setChatMessage(e.target.value)}
                              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-light)' }}
                            />
                            <button type="submit" disabled={isSending} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                              <Send size={16} />
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', textAlign: 'center' }}>
                          <Lock size={40} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Discussions Locked</h3>
                          <p style={{ fontSize: '13px', color: 'var(--muted-light)', maxWidth: '300px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Join the **{selectedComm.title}** community board to participate in discussions.
                          </p>
                          <button 
                            onClick={() => handleJoin(selectedComm)} 
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13px' }}
                          >
                            Join Community <ArrowRight size={14} />
                          </button>
                        </div>
                      )
                    )}

                    {/* TAB 2: About (Overview Metadata) */}
                    {activeTab === 'About' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 12px 0' }}>Community Guidelines</h4>
                          <ul style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                            <li>Stay focused on subject topics and technical skills.</li>
                            <li>Be supportive and collaborate during team recruitments.</li>
                            <li>Share verified resources, links, and documents.</li>
                            <li>Zero tolerance for spam or hostile behavior.</li>
                          </ul>
                        </div>
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Weekly Posts Velocity</span>
                            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0 0 0' }}>{enrichedSelected.weeklyActivity}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Enrolled Members</span>
                            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)', margin: '4px 0 0 0' }}>{selectedComm.membersCount || 1}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Announcements (Official Alerts) */}
                    {activeTab === 'Announcements' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isJoined && (
                          <form onSubmit={handleAddAnnouncement} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Post Official Update</h4>
                            <input 
                              type="text" 
                              required
                              placeholder="Announcement Header..." 
                              value={annTitle} 
                              onChange={e => setAnnTitle(e.target.value)} 
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                            />
                            <textarea 
                              required
                              placeholder="Announcement details..." 
                              value={annText} 
                              onChange={e => setAnnText(e.target.value)} 
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none', height: '60px', resize: 'none' }}
                            />
                            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '12px' }}>
                              Publish Announcement
                            </button>
                          </form>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {enrichedSelected.announcements.map((ann) => (
                            <div key={ann.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ background: 'rgba(255, 61, 0, 0.1)', color: '#FF3D00', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Volume2 size={12} /> OFFICIAL
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>{ann.date}</span>
                              </div>
                              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 6px 0' }}>{ann.title}</h4>
                              <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0, lineHeight: '1.5' }}>{ann.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Resources Sharing Hub */}
                    {activeTab === 'Resources' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isJoined && (
                          <form onSubmit={handleAddResource} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>Share Learning Material</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input 
                                type="text" 
                                required
                                placeholder="Material Name (e.g. Lecture Notes)" 
                                value={resourceName} 
                                onChange={e => setResourceName(e.target.value)} 
                                style={{ flex: 1, padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                              />
                              <select 
                                value={resourceType} 
                                onChange={e => setResourceType(e.target.value)}
                                style={{ padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                              >
                                <option>Link</option>
                                <option>Document</option>
                                <option>Design</option>
                              </select>
                            </div>
                            <input 
                              type="url" 
                              required
                              placeholder="URL (e.g. https://drive.google.com/...)" 
                              value={resourceUrl} 
                              onChange={e => setResourceUrl(e.target.value)} 
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                            />
                            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '12px' }}>
                              Share Link
                            </button>
                          </form>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {enrichedSelected.resources.map((res) => (
                            <div key={res.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px' }}>
                                    {res.type}
                                  </span>
                                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{res.name}</h4>
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Shared by: {res.sharedBy}</p>
                              </div>
                              <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Link2 size={12} /> Visit
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 5: Events (Associated events timelines) */}
                    {activeTab === 'Events' && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                          <Calendar size={18} color="var(--primary)" /> Associated Event Schedule
                        </h4>
                        
                        <div style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {[
                            { step: 'Phase 1: Registration', desc: 'Secure entry and build profiles.', status: 'Completed', color: '#00C853' },
                            { step: 'Phase 2: Project Outline Submission', desc: 'Submit abstract roadmap drafts.', status: 'Active', color: 'var(--primary)' },
                            { step: 'Phase 3: Code Submission & Final Lock', desc: 'Compile repository uploads.', status: 'Upcoming', color: 'var(--muted-light)' }
                          ].map((item, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h5 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{item.step}</h5>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: item.color }}>{item.status}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 6: Members List */}
                    {activeTab === 'Members' && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 8px 0' }}>Active Members</h4>
                        {enrichedSelected.members.map((member, idx) => (
                          <div key={idx} style={{ display: 'flex', justifycontent: 'space-between', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '8px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                {member.name.charAt(0)}
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-light)' }}>{member.name}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: member.status === 'Online' ? '#00C853' : 'var(--muted-light)', fontWeight: 'bold' }}>
                              {member.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TAB 7: Team Board (Team Formation Board) */}
                    {activeTab === 'Team Board' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {isJoined && (
                          <form onSubmit={handleAddTeamPost} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>List Team Recruitment</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input 
                                type="text" 
                                required
                                placeholder="Team Name" 
                                value={teamName} 
                                onChange={e => setTeamName(e.target.value)} 
                                style={{ flex: 1, padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                              />
                              <input 
                                type="number" 
                                required
                                min="1"
                                placeholder="Spots Open" 
                                value={teamSpots} 
                                onChange={e => setTeamSpots(e.target.value)} 
                                style={{ width: '80px', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                              />
                            </div>
                            <input 
                              type="text" 
                              required
                              placeholder="Role Needed (e.g. Figma Designer)" 
                              value={teamRole} 
                              onChange={e => setTeamRole(e.target.value)} 
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                            />
                            <textarea 
                              required
                              placeholder="Short pitch description of your project..." 
                              value={teamDesc} 
                              onChange={e => setTeamDesc(e.target.value)} 
                              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none', height: '60px', resize: 'none' }}
                            />
                            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '12px' }}>
                              Post Team Listing
                            </button>
                          </form>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {enrichedSelected.teamPosts.map((team) => (
                            <div key={team.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{team.teamName}</h4>
                                <span style={{ background: 'rgba(255, 61, 0, 0.1)', color: '#FF3D00', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px' }}>
                                  {team.spotsLeft} Spots Open
                                </span>
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', margin: 0 }}>Looking for: {team.roleNeeded}</p>
                              <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0, lineHeight: '1.4' }}>{team.description}</p>
                              {isJoined && (
                                <button onClick={() => alert(`Requested to join ${team.teamName}!`)} style={{ alignSelf: 'flex-start', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', cursor: 'pointer' }}>
                                  Request to Join Team
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 8: Leaderboard (Top Contributors) */}
                    {activeTab === 'Leaderboard' && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 8px 0' }}>Top Active Scholars</h4>
                        {enrichedSelected.leaderboard.map((user, idx) => (
                          <div key={idx} style={{ display: 'flex', justifycontent: 'space-between', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '8px' : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--muted-light)', minWidth: '20px' }}>{user.rank}</span>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-light)' }}>{user.name} {user.badge}</span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                              {user.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              );
            })()
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '24px' }}>
              <Users size={40} color="var(--border-light)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)' }}>Select a Community</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted-light)', maxWidth: '240px', margin: '8px auto 0' }}>Select a channel from the list to view its dashboard, timeline, resources, and live chats.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '32px', borderRadius: '16px', width: '450px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Create Community Group</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Group Name</label>
                <input 
                  required
                  placeholder="e.g. Flutter Developers" 
                  value={newCommName} 
                  onChange={e => setNewCommName(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                <textarea 
                  required
                  placeholder="What is this group about? Share guidelines and expectations..." 
                  value={newCommDesc} 
                  onChange={e => setNewCommDesc(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none', height: '80px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tag / Type</label>
                <select 
                  value={newCommTag} 
                  onChange={e => setNewCommTag(e.target.value)} 
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                >
                  <option>Interest</option>
                  <option>Technical</option>
                  <option>Institution</option>
                  <option>Event Specific</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>Create Group</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Internal XIcon to avoid import glitches
function XIcon(props) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
