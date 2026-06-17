import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCircle, AlertTriangle, Info, 
  ShieldAlert, Trash2, CheckCheck 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToNotifications, markNotificationRead, deleteNotification } from '../firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function NotificationPopover() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const popoverRef = useRef(null);

  // Sync notifications in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToNotifications(currentUser.uid, (list) => {
      setNotifications(list);

      if (pushEnabled && list.length > 0) {
        const latest = list[0];
        if (!latest.read) {
          if (Capacitor.isNativePlatform()) {
            // Native push
            LocalNotifications.schedule({
              notifications: [
                {
                  title: latest.title || "Orin Platform Alert",
                  body: latest.message || "You have a new alert.",
                  id: new Date().getTime(),
                  schedule: { at: new Date(Date.now() + 1000) },
                }
              ]
            });
          } else if (document.visibilityState === 'hidden') {
            // Web push
            new window.Notification(latest.title || "Orin Platform Alert", {
              body: latest.message || "You have a new alert.",
              icon: '/favicon.ico'
            });
          }
        }
      }
    });

    return unsubscribe;
  }, [currentUser, pushEnabled]);

  // Check current permission on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === 'granted') setPushEnabled(true);
      } else if ('Notification' in window && window.Notification.permission === 'granted') {
        setPushEnabled(true);
      }
    };
    checkPermissions();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle color="#28A745" size={16} />;
      case 'warning': return <AlertTriangle color="#FFA116" size={16} />;
      case 'alert': return <ShieldAlert color="#DC3545" size={16} />;
      default: return <Info color="var(--primary)" size={16} />;
    }
  };

  const handleMarkAsRead = async (id) => {
    if (!currentUser) return;
    try {
      await markNotificationRead(currentUser.uid, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const unreadList = notifications.filter(n => !n.read);
      await Promise.all(unreadList.map(n => markNotificationRead(currentUser.uid, n.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await deleteNotification(currentUser.uid, id);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePush = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          setPushEnabled(true);
          LocalNotifications.schedule({
            notifications: [
              {
                title: "Orin Platform",
                body: "Native system notifications enabled!",
                id: 1,
                schedule: { at: new Date(Date.now() + 1000) },
              }
            ]
          });
        } else {
          alert('System permission denied.');
        }
      } else {
        if (!('Notification' in window)) {
          alert('Browser does not support notifications.');
          return;
        }
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          setPushEnabled(true);
          new window.Notification("Orin Platform", {
            body: "Desktop alerts successfully enabled!",
            icon: '/favicon.ico'
          });
        } else {
          alert('Permission denied.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px', 
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}
      >
        <Bell size={24} color="var(--text-light)" />
        {unreadCount > 0 && (
          <div style={{ 
            position: 'absolute', top: 4, right: 6, width: 10, height: 10, 
            background: '#DC3545', borderRadius: '50%', border: '2px solid white' 
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          width: '320px', maxHeight: '480px', background: 'white',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1A1A1A' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Permissions Banner */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              <strong>System Alerts</strong>
            </div>
            <button 
              onClick={togglePush}
              style={{ 
                padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '11px',
                background: pushEnabled ? '#28A745' : 'var(--surface)', color: pushEnabled ? 'white' : 'var(--text)'
              }}
            >
              {pushEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-light)' }}>
                <Bell size={24} style={{ opacity: 0.5, margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px' }}>Your inbox is empty</div>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                  style={{
                    padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                    borderRadius: '12px', cursor: !n.read ? 'pointer' : 'default',
                    background: n.read ? 'transparent' : 'rgba(123, 97, 255, 0.05)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '13px', color: '#1A1A1A' }}>{n.title}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>{n.message}</p>
                    <div style={{ fontSize: '10px', color: '#ADB5BD', marginTop: '4px' }}>
                      {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    style={{ background: 'none', border: 'none', color: '#ADB5BD', cursor: 'pointer', padding: '2px', marginLeft: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
