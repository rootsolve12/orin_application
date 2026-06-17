import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Globe, 
  Users, 
  Send, 
  Hash, 
  Plus, 
  MessageSquare, 
  Lock, 
  Sparkles,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCommunities, 
  joinCommunity, 
  leaveCommunity, 
  sendCommunityMessage, 
  subscribeToCommunityMessages,
  createCommunity 
} from '../firebase/firestore';

export default function Communities() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  
  // Data States
  const [communitiesList, setCommunitiesList] = useState([]);
  const [selectedComm, setSelectedComm] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Form/Input States
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommTag, setNewCommTag] = useState('Interest');

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

  // 1. Load communities on mount
  useEffect(() => {
    const fetchComms = async () => {
      setLoading(true);
      try {
        let comms = await getCommunities();
        if (comms.length === 0) {
          // Initialize firestore with mocks so it is never empty
          await Promise.all(MOCK_COMMUNITIES.map(async (mock) => {
            await createCommunity(mock);
          }));
          comms = await getCommunities();
        }
        setCommunitiesList(comms);
        if (comms.length > 0 && !selectedComm) {
          setSelectedComm(comms[0]);
        }
      } catch (err) {
        console.error("Error loading communities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComms();
  }, [refreshKey]);

  // 2. Real-time community messages sync
  useEffect(() => {
    if (!selectedComm?.id) return;
    
    // Check if user has joined
    const joinedList = userProfile?.joinedCommunities || [];
    const isJoined = joinedList.includes(selectedComm.id);
    
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
      alert(`Joined community: ${comm.title}`);
      await refreshProfile();
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to join community.');
    }
  };

  // 4. Leave Community Operation
  const handleLeave = async (comm) => {
    if (!currentUser) return;
    try {
      await leaveCommunity(currentUser.uid, comm.id);
      alert(`Left community: ${comm.title}`);
      await refreshProfile();
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to leave community.');
    }
  };

  // 5. Create Community Operation
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommName.trim() || !newCommDesc.trim()) return alert("Fill in all fields!");
    try {
      const commData = {
        title: newCommName,
        description: newCommDesc,
        tag: newCommTag,
        memberIds: [currentUser.uid],
        membersCount: 1
      };
      await createCommunity(commData);
      alert('Community created successfully!');
      setShowCreateModal(false);
      setNewCommName('');
      setNewCommDesc('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to create community.');
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
        userProfile?.name || 'Anonymous', 
        textToSend
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredCommunities = communitiesList.filter(comm => 
    comm.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    comm.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && communitiesList.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>Loading Communities Hub...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0 40px', color: '#1A1A1A' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="heading-1">Communities & Forums</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Connect with peer groups, share knowledge, and explore topics.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
        >
          <Plus size={16} /> Create Group
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Search size={20} color="#6C757D" />
          <input 
            type="text" 
            placeholder="Search communities by name or interest keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px', fontSize: '14px', outline: 'none' }} 
          />
        </div>
      </div>

      {/* Main Split Panel */}
      <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 240px)' }}>
        
        {/* Left Grid Panel: Communities List */}
        <div style={{ width: '45%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCommunities.map((comm) => {
            const isJoined = (userProfile?.joinedCommunities || []).includes(comm.id);
            const isSelected = selectedComm?.id === comm.id;

            return (
              <div 
                key={comm.id} 
                onClick={() => setSelectedComm(comm)}
                style={{ 
                  background: 'white', 
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)', 
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(123, 97, 255, 0.05)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                      {comm.title}
                    </h3>
                    <span style={{ 
                      background: 'var(--surface)', color: 'var(--text-light)', fontSize: '10px', 
                      fontWeight: '800', padding: '2px 8px', borderRadius: '8px', 
                      textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' 
                    }}>
                      {comm.tag}
                    </span>
                  </div>
                  
                  {isJoined ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLeave(comm); }} 
                      style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-light)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
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

                <p style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  {comm.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)', fontSize: '13px' }}>
                  <Users size={16} />
                  <span>{comm.membersCount || 1} Members</span>
                </div>
              </div>
            );
          })}
          {filteredCommunities.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No communities found.</p>
          )}
        </div>

        {/* Right Split Panel: Live Chat Discussion */}
        <div style={{ flex: 1, background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedComm ? (
            (() => {
              const isJoined = (userProfile?.joinedCommunities || []).includes(selectedComm.id);
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Chat Header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} color="var(--primary)" />
                    <div>
                      <h2 style={{ fontSize: '15px', fontWeight: '800' }}>#{selectedComm.title} Discussion</h2>
                      <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>Live public discussion feed</p>
                    </div>
                  </div>

                  {/* Chat Feed / Join Guard */}
                  {isJoined ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflow: 'hidden' }}>
                      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '12px', margin: '8px 0' }}>
                          👋 Welcome to the #{selectedComm.title} community channel. Be polite and collaborative!
                        </div>

                        {messages.map((msg, idx) => {
                          const isMe = msg.userId === currentUser.uid;
                          return (
                            <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-light)', marginBottom: '2px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                                <strong>{msg.displayName}</strong> &bull; {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </div>
                              <div style={{ 
                                background: isMe ? 'var(--primary)' : 'white', 
                                color: isMe ? 'white' : 'var(--text)', 
                                padding: '10px 14px', 
                                borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                fontSize: '13px',
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

                      {/* Chat Input form */}
                      <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-light)', background: 'white' }}>
                        <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '6px 14px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                          <input 
                            placeholder={`Message #${selectedComm.title}...`}
                            value={chatMessage} 
                            onChange={e => setChatMessage(e.target.value)}
                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
                          />
                          <button type="submit" disabled={isSending} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Send size={16} />
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'var(--surface)', textAlign: 'center' }}>
                      <Lock size={36} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                      <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Discussion Locked</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-light)', maxWidth: '300px', lineHeight: '1.6', marginBottom: '20px' }}>
                        Join the **{selectedComm.title}** community to read discussions and post messages.
                      </p>
                      <button 
                        onClick={() => handleJoin(selectedComm)} 
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13px' }}
                      >
                        Join Community <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '24px' }}>
              <p className="text-muted">Select a community from the list to load discussion boards.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '450px', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Create Interest Group</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Group Name</label>
                <input 
                  placeholder="e.g. Flutter Developers" 
                  value={newCommName} 
                  onChange={e => setNewCommName(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                <textarea 
                  placeholder="What is this group about? Share guidelines and expectations..." 
                  value={newCommDesc} 
                  onChange={e => setNewCommDesc(e.target.value)} 
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tag / Type</label>
                <select 
                  value={newCommTag} 
                  onChange={e => setNewCommTag(e.target.value)} 
                  className="form-input"
                >
                  <option>Interest</option>
                  <option>Technical</option>
                  <option>Institution</option>
                  <option>Event Specific</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>Create Group</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
