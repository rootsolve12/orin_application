// Temporary utility
export const seedEventsOnce = async (currentUser) => {
  if (localStorage.getItem('seeded_real_events_2') || !currentUser) return false;
  
  const { createEvent } = await import('../firebase/firestore');
  
  const today = new Date();
  const makeDate = (daysAdd) => new Date(today.getTime() + daysAdd * 86400000).toISOString();

  const eventsToCreate = [
    {
      title: 'DevOps & Cloud Native Summit',
      category: 'Conference',
      date: makeDate(10),
      endDate: makeDate(12),
      registrationDeadline: makeDate(8),
      location: 'AWS Center & Online',
      mode: 'Hybrid',
      startTime: '09:00',
      endTime: '17:00',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600&h=300',
      status: 'Published'
    },
    {
      title: 'Open Source Contribution Sprint',
      category: 'Hackathons',
      date: makeDate(15),
      endDate: makeDate(17),
      registrationDeadline: makeDate(12),
      location: 'Online',
      mode: 'Online',
      startTime: '10:00',
      endTime: '20:00',
      bannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600&h=300',
      status: 'Published'
    },
    {
      title: 'UI/UX Design Masterclass',
      category: 'Webinars',
      date: makeDate(20),
      endDate: makeDate(20),
      registrationDeadline: makeDate(18),
      location: 'Google Meet',
      mode: 'Online',
      startTime: '16:00',
      endTime: '18:00',
      bannerUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600&h=300',
      status: 'Published'
    },
    {
      title: 'Cybersecurity CTF Challenge',
      category: 'Coding Competitions',
      date: makeDate(25),
      endDate: makeDate(26),
      registrationDeadline: makeDate(20),
      location: 'Las Vegas, NV',
      mode: 'Offline',
      startTime: '08:00',
      endTime: '20:00',
      bannerUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600&h=300',
      status: 'Published'
    }
  ];

  for (const ev of eventsToCreate) {
    await createEvent('admin_user', ev);
    // We intentionally DO NOT register the user for these events so they show up as available.
  }

  localStorage.setItem('seeded_real_events_2', 'true');
  return true; // Indicates it ran
};
