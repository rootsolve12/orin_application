// firebase/firestore.js
// Complete Firestore data layer — replaces all mock Node.js fetch() calls
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get all users in the system (for search indexing) */
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Check if a username is unique */
export const isUsernameUnique = async (username) => {
  if (!username) return false;
  const q = query(collection(db, 'users'), where('username', '==', username.trim().toLowerCase()));
  const snap = await getDocs(q);
  return snap.empty;
};

/** Get user profile details by username */
export const getUserProfileByUsername = async (username) => {
  if (!username) return null;
  const q = query(collection(db, 'users'), where('username', '==', username.trim().toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const updateUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────

/** Fetch all published events */
export const getAllEvents = async () => {
  const q = query(
    collection(db, 'events'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Fetch a single event */
export const getEvent = async (eventId) => {
  const snap = await getDoc(doc(db, 'events', eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Fetch events created by a specific organizer */
export const getOrganizerEvents = async (organizerId) => {
  const q = query(
    collection(db, 'events'),
    where('organizerId', '==', organizerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Create a new event */
export const createEvent = async (organizerId, eventData) => {
  const ref = await addDoc(collection(db, 'events'), {
    ...eventData,
    organizerId,
    currentRoundIndex: 0,
    rounds: [
      'Registration', 'Screening', 'Assessment',
      'Submission', 'Review', 'Shortlisting',
      'Final', 'Results', 'Certification',
    ],
    registeredCount: 0,
    status: eventData.status || 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/** Update event data */
export const updateEvent = async (eventId, data) => {
  await updateDoc(doc(db, 'events', eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** Advance event to next round */
export const advanceEventRound = async (eventId) => {
  await updateDoc(doc(db, 'events', eventId), {
    currentRoundIndex: increment(1),
    updatedAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────
// REGISTRATIONS
// ─────────────────────────────────────────────

/** Register a user for an event */
export const registerForEvent = async (eventId, userId, formData = {}) => {
  const eventRef = doc(db, 'events', eventId);
  const regRef = doc(db, 'events', eventId, 'registrations', userId);

  const existingReg = await getDoc(regRef);
  if (existingReg.exists()) throw new Error('Already registered');

  await setDoc(regRef, {
    userId,
    eventId,
    status: 'Approved',
    formData,
    registeredAt: serverTimestamp(),
  });

  // Increment event registered count
  await updateDoc(eventRef, { registeredCount: increment(1) });

  // Add to user's registered events list
  await updateDoc(doc(db, 'users', userId), {
    registeredEvents: arrayUnion(eventId),
  });
};

/** Get registrations for an event (organizer view) */
export const getEventRegistrations = async (eventId) => {
  const snap = await getDocs(collection(db, 'events', eventId, 'registrations'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get a user's registered events */
export const getUserRegistrations = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return [];
  const eventIds = userDoc.data().registeredEvents || [];
  if (eventIds.length === 0) return [];
  const events = await Promise.all(eventIds.map((id) => getEvent(id)));
  return events.filter(Boolean);
};

/** Get a single registration for an event */
export const getEventRegistration = async (eventId, userId) => {
  const snap = await getDoc(doc(db, 'events', eventId, 'registrations', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get user certificate for an event */
export const getUserCertificateForEvent = async (eventId, userId) => {
  const q = query(
    collection(db, 'certificates'),
    where('eventId', '==', eventId),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
};

/** Get all certificates for a user */
export const getUserCertificates = async (userId) => {
  const q = query(
    collection(db, 'certificates'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Add a manual certificate for a user */
export const addCertificate = async (userId, certData) => {
  const ref = await addDoc(collection(db, 'certificates'), {
    userId,
    ...certData,
    isManual: true,
    issuedAt: serverTimestamp(),
  });
  return ref.id;
};

/** Update registration status (organizer: Approved, Rejected, Waitlisted) */
export const updateRegistrationStatus = async (eventId, userId, status) => {
  await updateDoc(doc(db, 'events', eventId, 'registrations', userId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────

/** Submit a project (link-based) */
export const submitProject = async (eventId, userId, submissionData) => {
  const subRef = doc(db, 'events', eventId, 'submissions', userId);
  await setDoc(subRef, {
    userId,
    eventId,
    ...submissionData,
    status: 'Submitted',
    submittedAt: serverTimestamp(),
    versions: [{ ...submissionData, timestamp: new Date().toISOString() }],
  });
};

/** Upload a file to Firebase Storage and return download URL */
export const uploadSubmissionFile = async (eventId, userId, file, onProgress) => {
  const path = `submissions/${eventId}/${userId}/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

/** Get all submissions for an event (organizer/judge view) */
export const getEventSubmissions = async (eventId) => {
  const snap = await getDocs(collection(db, 'events', eventId, 'submissions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Save evaluation/rubric score */
export const evaluateSubmission = async (eventId, userId, evaluation) => {
  await updateDoc(doc(db, 'events', eventId, 'submissions', userId), {
    ...evaluation,
    status: evaluation.isShortlisted ? 'Shortlisted' : 'Evaluated',
    evaluatedAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────

/** Get a team by id */
export const getTeam = async (teamId) => {
  const snap = await getDoc(doc(db, 'teams', teamId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get all teams associated with a specific event */
export const getEventTeams = async (eventId) => {
  const q = query(collection(db, 'teams'), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Create a new team */
export const createTeam = async (leaderId, teamName, eventId) => {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const ref = doc(collection(db, 'teams'));
  await setDoc(ref, {
    name: teamName,
    leaderId,
    eventId: eventId || null,
    memberIds: [leaderId],
    inviteCode,
    tasks: [],
    links: [],
    vault: [],
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'users', leaderId), { teamId: ref.id }, { merge: true });
  return { id: ref.id, inviteCode };
};

/** Join a team via invite code */
export const joinTeam = async (userId, inviteCode) => {
  const q = query(collection(db, 'teams'), where('inviteCode', '==', inviteCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid invite code');
  const teamDoc = snap.docs[0];
  await updateDoc(doc(db, 'teams', teamDoc.id), {
    memberIds: arrayUnion(userId),
  });
  await setDoc(doc(db, 'users', userId), { teamId: teamDoc.id }, { merge: true });
  return { id: teamDoc.id, ...teamDoc.data() };
};

export const subscribeToTeam = (teamId, callback) => {
  return onSnapshot(doc(db, 'teams', teamId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
};

export const disbandTeam = async (teamId) => {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) return;
  const memberIds = teamSnap.data().memberIds || [];
  
  // Remove teamId reference from all members
  await Promise.all(
    memberIds.map(id => setDoc(doc(db, 'users', id), { teamId: null }, { merge: true }))
  );
  
  // Delete the team document
  await deleteDoc(teamRef);
};

export const updateTeamLinks = async (teamId, linksArray) => {
  await updateDoc(doc(db, 'teams', teamId), {
    links: linksArray
  });
};

export const updateTeamVault = async (teamId, vaultArray) => {
  await updateDoc(doc(db, 'teams', teamId), {
    vault: vaultArray
  });
};

/** Send a message in a team chat */
export const sendTeamMessage = async (teamId, userId, displayName, text) => {
  await addDoc(collection(db, 'teams', teamId, 'messages'), {
    userId,
    displayName,
    text,
    timestamp: serverTimestamp(),
  });
};

/** Subscribe to team messages (real-time) */
export const subscribeToTeamMessages = (teamId, callback) => {
  const q = query(
    collection(db, 'teams', teamId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

/** Add a notification to a user's subcollection */
export const addNotification = async (userId, notification) => {
  await addDoc(collection(db, 'users', userId, 'notifications'), {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/** Subscribe to a user's notifications (real-time) */
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/** Mark a notification as read */
export const markNotificationRead = async (userId, notificationId) => {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
    read: true,
  });
};

/** Delete a notification */
export const deleteNotification = async (userId, notificationId) => {
  await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
};

// ─────────────────────────────────────────────
// COMMUNITIES / ANNOUNCEMENTS
// ─────────────────────────────────────────────

/** Post an announcement in an event community */
export const postAnnouncement = async (eventId, organizerId, message, pinned = false) => {
  await addDoc(collection(db, 'events', eventId, 'announcements'), {
    organizerId,
    message,
    pinned,
    createdAt: serverTimestamp(),
  });
};

/** Get announcements for an event */
export const getAnnouncements = async (eventId) => {
  const q = query(
    collection(db, 'events', eventId, 'announcements'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────

/** Issue a certificate for a user */
export const issueCertificate = async (eventId, userId, eventTitle, participantName) => {
  const certId = `ORIN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  await setDoc(doc(db, 'certificates', certId), {
    certId,
    eventId,
    userId,
    eventTitle,
    participantName,
    issuedAt: serverTimestamp(),
    verified: true,
  });
  await updateDoc(doc(db, 'users', userId), {
    certificates: increment(1),
    earnedCertificates: arrayUnion(certId),
  });
  return certId;
};

/** Verify a certificate */
export const verifyCertificate = async (certId) => {
  const snap = await getDoc(doc(db, 'certificates', certId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Upload an event banner to Firebase Storage */
export const uploadEventBanner = async (file, onProgress) => {
  const path = `banners/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

/** Upload a file for a team workspace vault */
export const uploadTeamFile = async (teamId, file, onProgress) => {
  const path = `teams/${teamId}/vault/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

/** Add a file metadata entry to the team vault list */
export const addTeamVaultFile = async (teamId, fileData) => {
  await updateDoc(doc(db, 'teams', teamId), {
    vault: arrayUnion(fileData),
    updatedAt: serverTimestamp(),
  });
};

/** Leave a team workspace */
export const leaveTeam = async (userId, teamId) => {
  await updateDoc(doc(db, 'teams', teamId), {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', userId), {
    teamId: null,
    updatedAt: serverTimestamp(),
  });
};

/** Get all communities */
export const getCommunities = async () => {
  const snap = await getDocs(collection(db, 'communities'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Create a new community */
export const createCommunity = async (commData) => {
  const ref = await addDoc(collection(db, 'communities'), {
    ...commData,
    membersCount: commData.memberIds?.length || 1,
    createdAt: serverTimestamp()
  });
  
  if (commData.memberIds && commData.memberIds.length > 0) {
    const creatorId = commData.memberIds[0];
    await updateDoc(doc(db, 'users', creatorId), {
      joinedCommunities: arrayUnion(ref.id)
    });
  }
  return ref.id;
};

/** Join a community */
export const joinCommunity = async (userId, communityId) => {
  await updateDoc(doc(db, 'communities', communityId), {
    memberIds: arrayUnion(userId),
    membersCount: increment(1)
  });
  await updateDoc(doc(db, 'users', userId), {
    joinedCommunities: arrayUnion(communityId)
  });
};

/** Leave a community */
export const leaveCommunity = async (userId, communityId) => {
  await updateDoc(doc(db, 'communities', communityId), {
    memberIds: arrayRemove(userId),
    membersCount: increment(-1)
  });
  await updateDoc(doc(db, 'users', userId), {
    joinedCommunities: arrayRemove(communityId)
  });
};

/** Send message inside a community chat */
export const sendCommunityMessage = async (communityId, userId, displayName, text) => {
  await addDoc(collection(db, 'communities', communityId, 'messages'), {
    userId,
    displayName,
    text,
    timestamp: serverTimestamp(),
  });
};

/** Subscribe to community messages (real-time) */
export const subscribeToCommunityMessages = (communityId, callback) => {
  const q = query(
    collection(db, 'communities', communityId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

/** Create a support ticket in Firestore */
export const createSupportTicket = async (ticketData) => {
  const ref = await addDoc(collection(db, 'tickets'), {
    ...ticketData,
    status: 'Open',
    createdAt: serverTimestamp()
  });
  return ref.id;
};

/** Save assessment results */
export const submitAssessment = async (eventId, userId, assessmentData) => {
  const ref = doc(db, 'events', eventId, 'assessments', userId);
  await setDoc(ref, {
    userId,
    eventId,
    ...assessmentData,
    submittedAt: serverTimestamp()
  });
};

/** Retrieve assessment results */
export const getAssessment = async (eventId, userId) => {
  const snap = await getDoc(doc(db, 'events', eventId, 'assessments', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Check in a participant */
export const checkInParticipant = async (eventId, userId) => {
  await updateDoc(doc(db, 'events', eventId, 'registrations', userId), {
    checkedIn: true,
    checkedInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/** Post an emergency alert for an event */
export const addEmergencyAlert = async (eventId, message) => {
  await addDoc(collection(db, 'events', eventId, 'emergencies'), {
    message,
    createdAt: serverTimestamp()
  });
};

/** Subscribe to emergencies for an event */
export const subscribeToEmergencies = (eventId, callback) => {
  const q = query(
    collection(db, 'events', eventId, 'emergencies'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─────────────────────────────────────────────
// ACHIEVEMENTS & PORTFOLIOS
// ─────────────────────────────────────────────

/** Get all achievements for a user */
export const getUserAchievements = async (userId) => {
  const q = query(
    collection(db, 'achievements'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Add a new achievement */
export const addAchievement = async (userId, data) => {
  const ref = await addDoc(collection(db, 'achievements'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/** Update an achievement */
export const updateAchievement = async (achievementId, data) => {
  await updateDoc(doc(db, 'achievements', achievementId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** Delete an achievement */
export const deleteAchievement = async (achievementId) => {
  await deleteDoc(doc(db, 'achievements', achievementId));
};

// ─────────────────────────────────────────────
// TEAM WORKSPACE EXTENSIONS (Kanban & Quick Links)
// ─────────────────────────────────────────────

export const addTeamTask = async (teamId, taskData) => {
  await updateDoc(doc(db, 'teams', teamId), {
    tasks: arrayUnion({
      id: `task_${Date.now()}`,
      ...taskData,
      createdAt: new Date().toISOString()
    })
  });
};

export const updateTeamTaskStatus = async (teamId, tasksArray) => {
  // Overwrites the entire tasks array for reordering/status changes
  await updateDoc(doc(db, 'teams', teamId), {
    tasks: tasksArray
  });
};

export const addTeamLink = async (teamId, linkData) => {
  await updateDoc(doc(db, 'teams', teamId), {
    links: arrayUnion({
      id: `link_${Date.now()}`,
      ...linkData,
      createdAt: new Date().toISOString()
    })
  });
};

// ─────────────────────────────────────────────
// SAVED EVENTS
// ─────────────────────────────────────────────

export const toggleSaveEvent = async (userId, eventId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;
  const saved = userDoc.data().savedEvents || [];
  if (saved.includes(eventId)) {
    await updateDoc(userRef, { savedEvents: arrayRemove(eventId) });
  } else {
    await updateDoc(userRef, { savedEvents: arrayUnion(eventId) });
  }
};

export const getUserSavedEvents = async (userId) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return [];
  const eventIds = userDoc.data().savedEvents || [];
  if (eventIds.length === 0) return [];
  const events = await Promise.all(eventIds.map((id) => getEvent(id)));
  return events.filter(Boolean);
};


