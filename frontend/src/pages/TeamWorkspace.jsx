import { useState, useEffect, useRef } from 'react';
import { 
  Hash, File, Link as LinkIcon, Send, Clock, Clipboard, Check, 
  LogOut, UploadCloud, Loader2, Info, Video, Plus, ExternalLink,
  KanbanSquare, Trash2, X, FileText, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createTeam, joinTeam, getUserProfile, sendTeamMessage, 
  subscribeToTeamMessages, uploadTeamFile, addTeamVaultFile, leaveTeam,
  getEvent, getUserRegistrations,
  addTeamTask, updateTeamTaskStatus, addTeamLink,
  subscribeToTeam, disbandTeam, updateTeamLinks, updateTeamVault
} from '../firebase/firestore';

export default function TeamWorkspace() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  
  // Input fields
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  
  // New Feature Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [linkedEvent, setLinkedEvent] = useState(null);

  // Tabs for Right Panel
  const [rightTab, setRightTab] = useState('vault'); // 'vault', 'kanban', 'links'

  const chatBottomRef = useRef(null);

  useEffect(() => {
    let unsubscribeTeam = () => {};
    
    const setupTeamSubscription = async () => {
      if (!userProfile?.teamId) {
        setTeam(null);
        setTeamMembers([]);
        setLinkedEvent(null);
        
        if (currentUser) {
          try {
            const regs = await getUserRegistrations(currentUser.uid);
            const teamEvents = regs.filter(e => e.isTeamEvent);
            setRegisteredEvents(teamEvents);
            if (teamEvents.length > 0) {
              setSelectedEventId(teamEvents[0].id);
            }
          } catch (err) {
            console.error("Error fetching registrations:", err);
          }
        }
        setLoading(false);
        return;
      }
      
      setLoading(true);
      unsubscribeTeam = subscribeToTeam(userProfile.teamId, async (teamData) => {
        if (!teamData) {
          setTeam(null);
          setTeamMembers([]);
          setLinkedEvent(null);
          await refreshProfile();
          setLoading(false);
          return;
        }
        
        setTeam(teamData);
        
        if (teamData.eventId) {
          try {
            const eventData = await getEvent(teamData.eventId);
            setLinkedEvent(eventData);
          } catch (err) {
            console.error("Error fetching event:", err);
          }
        } else {
          setLinkedEvent(null);
        }
        setLoading(false);
      });
    };
    
    setupTeamSubscription();
    
    return () => {
      unsubscribeTeam();
    };
  }, [userProfile?.teamId, currentUser, refreshProfile]);

  useEffect(() => {
    if (!team?.memberIds) return;
    
    const fetchMemberProfiles = async () => {
      try {
        const memberProfiles = await Promise.all(
          team.memberIds.map(async (id) => {
            const profile = await getUserProfile(id);
            return { uid: id, ...profile };
          })
        );
        setTeamMembers(memberProfiles);
      } catch (err) {
        console.error("Error fetching member profiles:", err);
      }
    };
    
    fetchMemberProfiles();
  }, [team?.memberIds]);

  useEffect(() => {
    if (!team?.id) return;
    const unsubscribe = subscribeToTeamMessages(team.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsubscribe;
  }, [team?.id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return alert("Enter team name!");
    setIsSubmitting(true);
    try {
      await createTeam(currentUser.uid, newTeamName, selectedEventId || null);
      alert('Team created successfully!');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to create team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return alert("Enter invite code!");
    setIsSubmitting(true);
    try {
      await joinTeam(currentUser.uid, inviteCodeInput.trim().toUpperCase());
      alert('Successfully joined the team!');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Invalid code or failed to join.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !team?.id) return;
    const textToSend = chatMessage;
    setChatMessage('');
    try {
      await sendTeamMessage(team.id, currentUser.uid, userProfile.displayName || currentUser?.displayName || 'Anonymous', textToSend);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVaultUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !team?.id) return;
    setUploadProgress(0);
    try {
      const downloadUrl = await uploadTeamFile(team.id, file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      const fileData = {
        name: file.name, url: downloadUrl, size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uploaderName: userProfile.displayName || currentUser?.displayName || 'Team Member', uploadedAt: new Date().toISOString()
      };
      await addTeamVaultFile(team.id, fileData);
      setUploadProgress(null);
      alert('File uploaded to team vault!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload file.');
      setUploadProgress(null);
    }
  };

  const copyInviteCode = () => {
    if (!team?.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDisbandTeam = async () => {
    if (!team?.id) return;
    if (window.confirm("Are you sure you want to DISBAND this team? All members will be removed, and all tasks, vault files, and links will be permanently deleted.")) {
      setIsSubmitting(true);
      try {
        await disbandTeam(team.id);
        alert('Team disbanded successfully.');
        setTeam(null);
        setTeamMembers([]);
        setMessages([]);
        await refreshProfile();
      } catch (err) {
        console.error(err);
        alert('Failed to disband team.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLeaveTeam = async () => {
    if (!team?.id) return;
    if (window.confirm("Are you sure you want to leave this team?")) {
      try {
        await leaveTeam(currentUser.uid, team.id);
        alert('You have successfully left the team.');
        setTeam(null);
        setTeamMembers([]);
        setMessages([]);
        await refreshProfile();
      } catch (err) {
        console.error(err);
        alert('Error leaving team.');
      }
    }
  };

  // NEW: Kanban / Tasks
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !team?.id) return;
    setIsSubmitting(true);
    try {
      const taskObj = { title: newTaskTitle, status: 'todo', assignees: [] };
      await addTeamTask(team.id, taskObj);
      setNewTaskTitle('');
      setShowTaskInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (taskIndex) => {
    if (!team?.id) return;
    const tasks = [...(team.tasks || [])];
    const currentStatus = tasks[taskIndex].status;
    tasks[taskIndex].status = currentStatus === 'todo' ? 'in-progress' : (currentStatus === 'in-progress' ? 'done' : 'todo');
    try {
      await updateTeamTaskStatus(team.id, tasks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (e, taskIndex) => {
    e.stopPropagation();
    if (!team?.id) return;
    const tasks = (team.tasks || []).filter((_, idx) => idx !== taskIndex);
    try {
      await updateTeamTaskStatus(team.id, tasks);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // NEW: Quick Links
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim() || !team?.id) return;
    setIsSubmitting(true);
    try {
      const linkObj = { title: newLinkTitle, url: newLinkUrl };
      await addTeamLink(team.id, linkObj);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setShowLinkInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLink = async (e, linkIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!team?.id) return;
    const links = (team.links || []).filter((_, idx) => idx !== linkIndex);
    try {
      await updateTeamLinks(team.id, links);
    } catch (err) {
      console.error("Failed to delete link:", err);
    }
  };

  const handleDeleteVaultFile = async (e, fileIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!team?.id) return;
    const vault = (team.vault || []).filter((_, idx) => idx !== fileIndex);
    try {
      await updateTeamVault(team.id, vault);
    } catch (err) {
      console.error("Failed to delete vault file:", err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-light)' }}>Loading Mission Control...</div>;
  }

  if (!team) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <h1 className="heading-1" style={{ marginBottom: '8px', textAlign: 'center', color: 'var(--text-light)' }}>Team Workspace</h1>
        <p className="text-muted" style={{ marginBottom: '32px', textAlign: 'center', color: 'var(--muted-light)' }}>Create or join a team to participate in collaborative events.</p>
        
        {registeredEvents.length > 0 && (
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-light)' }}>
              <Info size={16} color="var(--primary)" /> Contextual Teaming Active
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginBottom: '12px' }}>
              Select which registered team event this team is for:
            </p>
            <select 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)} 
              className="form-input"
              style={{ background: 'var(--bg-light)', color: 'var(--text-light)' }}
            >
              {registeredEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
        )}

        <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
          <h2 className="heading-2" style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--text-light)' }}>Join an Existing Team</h2>
          <form onSubmit={handleJoinTeam} style={{ display: 'flex', gap: '12px' }}>
            <input 
              placeholder="Enter 6-digit Invite Code" 
              className="form-input" 
              style={{ flex: 1, background: 'var(--bg-light)', color: 'var(--text-light)', textTransform: 'uppercase' }} 
              value={inviteCodeInput} 
              onChange={e => setInviteCodeInput(e.target.value)} 
              maxLength={20}
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary">Join Team</button>
          </form>
        </div>

        <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <h2 className="heading-2" style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--text-light)' }}>Create a New Team</h2>
          <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '12px' }}>
            <input 
              placeholder="e.g. Lambda Hackers" 
              className="form-input" 
              style={{ flex: 1, background: 'var(--bg-light)', color: 'var(--text-light)' }} 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
              Create Team
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '20px' }}>
      
      {/* Top Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
        borderRadius: '18px', padding: '24px 32px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(109, 40, 217, 0.15)'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.9, marginBottom: '4px' }}>
            Mission Control Workspace
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{team.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '12px', backdropFilter: 'blur(10px)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={16} /> Code: {team.inviteCode}
            <button onClick={copyInviteCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0, marginLeft: '4px' }}>
              {copiedCode ? <Check size={14} color="#10B981" /> : <Clipboard size={14} />}
            </button>
          </div>
          <button style={{ 
            background: 'white', color: 'var(--primary)', border: 'none', padding: '10px 20px', 
            borderRadius: '12px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
          }} 
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseOut={e => e.currentTarget.style.transform = 'none'}
          onClick={() => alert("Launching Secure Video Room...")}>
            <Video size={16} fill="var(--primary)" /> Join Call
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* Left Sidebar: Roster & Event Context */}
        <div style={{ width: '280px', background: 'var(--surface)', borderRadius: '18px', border: '1px solid var(--border-light)', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '0 4px 18px rgba(0,0,0,0.015)' }}>
          {linkedEvent && (
            <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(109, 40, 217, 0.1)', marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.5px' }}>Bound Event</div>
              <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '6px', color: 'var(--text-light)', wordBreak: 'break-word', lineHeight: '1.4' }}>{linkedEvent.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                <Clock size={12} /> {linkedEvent.date ? new Date(linkedEvent.date).toLocaleDateString() : 'TBD'}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted-light)', fontWeight: '800', letterSpacing: '1px', marginBottom: '16px' }}>
            Roster ({teamMembers.length})
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {teamMembers.map((m, idx) => {
              const isLeader = m.uid === team.leaderId;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isLeader ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLeader ? 'white' : 'var(--text-light)', border: isLeader ? 'none' : '1px solid var(--border-light)', fontWeight: '800', fontSize: '14px', boxShadow: isLeader ? '0 4px 12px rgba(109, 40, 217, 0.2)' : 'none' }}>
                    {m.displayName ? m.displayName.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.displayName || 'Member'}</div>
                    <div style={{ fontSize: '11px', color: isLeader ? 'var(--primary)' : 'var(--muted-light)', fontWeight: isLeader ? '700' : '500' }}>
                      {isLeader ? 'Team Leader' : 'Developer'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentUser.uid === team.leaderId ? (
            <button 
              onClick={handleDisbandTeam}
              style={{ width: '100%', border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
              disabled={isSubmitting}
            >
              <Trash2 size={16} /> Disband Team
            </button>
          ) : (
            <button 
              onClick={handleLeaveTeam}
              style={{ width: '100%', border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} /> Leave Workspace
            </button>
          )}
        </div>

        {/* Middle Pane: Chat Hub */}
        <div style={{ flex: 1, background: 'var(--surface)', borderRadius: '18px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 18px rgba(0,0,0,0.015)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)' }}>general-channel</h2>
          </div>
          
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '16px' }} className="custom-scroll">
            <div style={{ textAlign: 'center', margin: '12px 0 24px', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', background: 'var(--primary-light)', border: '1px solid rgba(109, 40, 217, 0.1)', padding: '10px 16px', borderRadius: '12px', alignSelf: 'center', maxWidth: '90%' }}>
              🔒 Messages are encrypted and stored inside your team workspace vault.
            </div>
            
            {messages.map((msg, i) => {
              const isMe = msg.userId === currentUser.uid;
              return (
                <div 
                  key={msg.id || i} 
                  style={{ 
                    display: 'flex', flexDirection: 'column', 
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--muted-light)', marginBottom: '4px', fontWeight: '600', paddingLeft: isMe ? '0' : '4px', paddingRight: isMe ? '4px' : '0' }}>
                    {msg.displayName} &bull; {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                  <div style={{ 
                    background: isMe ? 'var(--primary)' : 'var(--surface)', 
                    color: isMe ? 'white' : 'var(--text-light)', 
                    padding: '12px 18px', 
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: isMe ? 'none' : '1px solid var(--border-light)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          
          <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid var(--border-light)', background: 'var(--surface)', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-light)', padding: '10px 18px', borderRadius: '24px', border: '1px solid var(--border-light)', transition: 'all 0.2s' }}
                 onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                 onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-light)'}>
              <input 
                placeholder="Message your team..." 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--text-light)' }}
                value={chatMessage} 
                onChange={e => setChatMessage(e.target.value)}
              />
              <button type="submit" style={{ background: 'var(--primary)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                <Send size={14} style={{ marginLeft: '-2px' }} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Dynamic Tools (Vault, Kanban, Links) */}
        <div style={{ width: '340px', background: 'var(--surface)', borderRadius: '18px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.015)' }}>
          
          {/* Tool Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
            {[
              { id: 'kanban', icon: <KanbanSquare size={16} />, label: 'Tasks' },
              { id: 'vault', icon: <File size={16} />, label: 'Vault' },
              { id: 'links', icon: <LinkIcon size={16} />, label: 'Links' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                style={{ 
                  flex: 1, padding: '16px 0', background: rightTab === tab.id ? 'var(--surface)' : 'transparent',
                  border: 'none', borderBottom: rightTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: rightTab === tab.id ? 'var(--primary)' : 'var(--muted-light)',
                  fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scroll">
            
            {/* KANBAN TAB */}
            {rightTab === 'kanban' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Backlog</h3>
                  <button onClick={() => setShowTaskInput(!showTaskInput)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} />
                  </button>
                </div>

                {showTaskInput && (
                  <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-light)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <input autoFocus placeholder="Task description..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-light)', fontSize: '13px', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowTaskInput(false)} style={{ fontSize: '12px', color: 'var(--muted-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button type="submit" disabled={isSubmitting} style={{ fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Task</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(team.tasks || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted-light)', fontSize: '13px', border: '2px dashed var(--border-light)', borderRadius: '14px' }}>No tasks assigned yet. Add one to get started!</div>
                  ) : (
                    (team.tasks || []).map((task, idx) => {
                      const isDone = task.status === 'done';
                      const isInProgress = task.status === 'in-progress';
                      
                      let statusBg = 'var(--bg-light)';
                      let statusText = 'var(--muted-light)';
                      let statusLabel = 'To Do';
                      
                      if (isDone) {
                        statusBg = '#D1FAE5';
                        statusText = '#065F46';
                        statusLabel = 'Done';
                      } else if (isInProgress) {
                        statusBg = '#FEF3C7';
                        statusText = '#92400E';
                        statusLabel = 'In Progress';
                      }

                      const isLeader = currentUser.uid === team.leaderId;
                      return (
                        <div key={idx} onClick={() => toggleTaskStatus(idx)} style={{ background: 'var(--surface)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}
                             onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(109, 40, 217, 0.2)'}
                             onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: isDone ? 'var(--muted-light)' : 'var(--text-light)', textDecoration: isDone ? 'line-through' : 'none', fontWeight: '600', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {task.title}
                            </span>
                            {isLeader && (
                              <button 
                                onClick={(e) => handleDeleteTask(e, idx)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--muted-light)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--muted-light)'}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', background: statusBg, color: statusText, padding: '2px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {statusLabel}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '500' }}>Click to cycle status</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* VAULT TAB */}
            {rightTab === 'vault' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: '1.4' }}>Securely share design files, PDFs, or code snippets with your team.</p>
                
                <div style={{ border: '2px dashed var(--primary)', borderRadius: '14px', padding: '24px 16px', textAlign: 'center', background: 'var(--primary-light)', position: 'relative', transition: 'all 0.2s' }}>
                  {uploadProgress !== null ? (
                    <div>
                      <Loader2 className="animate-spin" size={24} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)' }}>Uploading: {uploadProgress}%</span>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <UploadCloud size={28} color="var(--primary)" />
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)' }}>Drop files or Browse</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Max file size 50MB</span>
                      <input type="file" onChange={handleVaultUpload} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  {team.vault?.map((file, idx) => {
                    const isLeader = currentUser.uid === team.leaderId;
                    return (
                      <div key={idx} style={{ padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <a href={file.url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all', flex: 1 }}>
                            <FileText size={14} style={{ flexShrink: 0 }} /> {file.name}
                          </a>
                          {isLeader && (
                            <button 
                              onClick={(e) => handleDeleteVaultFile(e, idx)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--muted-light)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                              onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                              onMouseOut={e => e.currentTarget.style.color = 'var(--muted-light)'}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-light)' }}>
                          <span>Uploaded by {file.uploaderName}</span>
                          <span>{file.size}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LINKS TAB */}
            {rightTab === 'links' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Links</h3>
                  <button onClick={() => setShowLinkInput(!showLinkInput)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} />
                  </button>
                </div>

                {showLinkInput && (
                  <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-light)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <input placeholder="Title (e.g. GitHub Repo)" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-light)', fontSize: '13px', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    <input placeholder="https://..." value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-light)', fontSize: '13px', padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button type="button" onClick={() => setShowLinkInput(false)} style={{ fontSize: '12px', color: 'var(--muted-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button type="submit" disabled={isSubmitting} style={{ fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Link</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(team.links || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted-light)', fontSize: '13px', border: '2px dashed var(--border-light)', borderRadius: '14px' }}>Pin important resources here.</div>
                  ) : (
                    (team.links || []).map((link, idx) => {
                      const isLeader = currentUser.uid === team.leaderId;
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: 'var(--surface)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-light)', 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                          }}
                          onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(109, 40, 217, 0.2)'}
                          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                        >
                          <a href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-light)', flex: 1, minWidth: 0 }}>
                            <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', display: 'flex', flexShrink: 0 }}><ExternalLink size={16} color="var(--primary)" /></div>
                            <span style={{ fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title}</span>
                          </a>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <a href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted-light)', transition: 'color 0.2s' }}
                               onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'}
                               onMouseOut={e => e.currentTarget.style.color = 'var(--muted-light)'}>
                              <ArrowRight size={14} />
                            </a>
                            {isLeader && (
                              <button 
                                onClick={(e) => handleDeleteLink(e, idx)} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--muted-light)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--muted-light)'}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
