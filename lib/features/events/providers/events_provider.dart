import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/event_model.dart';
import '../../auth/providers/auth_provider.dart';

// ── Category filter state ──────────────────────────────────────────────────
final selectedCategoryProvider =
StateProvider<EventCategory?>((ref) => null);

// ── Search query state ─────────────────────────────────────────────────────
final searchQueryProvider = StateProvider<String>((ref) => '');

// ── Scope filter state ──────────────────────────────────────────────────────
final scopeFilterProvider = StateProvider<String>((ref) => 'all'); // 'all' | 'college' | 'nearby'
final userLocationProvider = StateProvider<({double lat, double lng})?>((ref) => null);

// ── Sort option state ───────────────────────────────────────────────────────
final sortOptionProvider = StateProvider<String>((ref) => 'latest'); // 'latest' | 'popular' | 'deadline'

// ── Live event feed ────────────────────────────────────────────────────────
final eventFeedProvider = StreamProvider<List<EventModel>>((ref) {
  final db       = ref.watch(firestoreProvider);
  final category = ref.watch(selectedCategoryProvider);

  Query<Map<String, dynamic>> q = db
      .collection('events')
      .where('state', isEqualTo: EventState.open.name);

  if (category != null) {
    q = q.where('category', isEqualTo: category.name);
  }

  return q.snapshots().map((snap) =>
      snap.docs.map(EventModel.fromFirestore).toList());
});

// ── Single event ───────────────────────────────────────────────────────────
final singleEventProvider =
StreamProvider.family<EventModel?, String>((ref, id) {
  final db = ref.watch(firestoreProvider);
  return db.collection('events').doc(id).snapshots().map(
          (doc) => doc.exists ? EventModel.fromFirestore(doc) : null);
});

// ── Organizer's events ─────────────────────────────────────────────────────
final organizerEventsProvider =
StreamProvider.family<List<EventModel>, String>((ref, uid) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('events')
      .where('organizerId', isEqualTo: uid)
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) => s.docs.map(EventModel.fromFirestore).toList());
});

// ── User's registrations ───────────────────────────────────────────────────
final userRegistrationsProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collectionGroup('registrations')
      .where('userId', isEqualTo: userId)
      .snapshots()
      .asyncMap((snap) async {
    List<Map<String, dynamic>> results = [];
    for (var doc in snap.docs) {
      final eventId = doc.reference.parent.parent?.id;
      if (eventId != null) {
        final eventDoc = await db.collection('events').doc(eventId).get();
        if (eventDoc.exists) {
          results.add({
            'registration': doc.data(),
            'event': EventModel.fromFirestore(eventDoc),
          });
        }
      }
    }
    return results;
  });
});

// ── Event service ──────────────────────────────────────────────────────────
final eventServiceProvider = Provider((ref) {
  return EventService(ref.watch(firestoreProvider));
});

class EventService {
  final FirebaseFirestore _db;
  EventService(this._db);

  Future<String> createEvent(EventModel event) async {
    final ref = await _db.collection('events').add(event.toFirestore());
    return ref.id;
  }

  Future<void> updateEvent(String id, Map<String, dynamic> data) =>
      _db.collection('events').doc(id).update(data);

  Future<void> publishEvent(String id) =>
      _db.collection('events').doc(id)
          .update({'state': EventState.open.name});

  // Registration with Firestore transaction (prevents over-registration)
  Future<void> registerForEvent({
    required String eventId,
    required String userId,
    required String userName,
    required String userInstitution,
    required bool approvalRequired,
  }) async {
    final eventRef = _db.collection('events').doc(eventId);
    final regRef   = eventRef.collection('registrations').doc(userId);

    await _db.runTransaction((tx) async {
      final snap = await tx.get(eventRef);
      if (!snap.exists) throw Exception('Event not found');
      
      final data  = snap.data()!;
      final count = data['registeredCount'] as int;
      final cap   = data['capacity'] as int;

      if (count >= cap) throw Exception('Event is full');

      final existing = await tx.get(regRef);
      if (existing.exists) throw Exception('Already registered');

      tx.set(regRef, {
        'userId':       userId,
        'userName':     userName,
        'institution':  userInstitution,
        'status':       approvalRequired ? 'pending' : 'approved',
        'registeredAt': FieldValue.serverTimestamp(),
      });

      if (!approvalRequired) {
        tx.update(eventRef, {'registeredCount': FieldValue.increment(1)});
      }
    });

    // Write registration confirmation notification
    final notifTitle = approvalRequired
        ? 'Registration Submitted'
        : 'Registration Confirmed';
    final notifBody = approvalRequired
        ? 'Your registration for event is pending organizer approval.'
        : 'You are successfully registered! Check your tickets.';
    await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
      'type': approvalRequired ? 'registration_pending' : 'registration_approved',
      'title': notifTitle,
      'body': notifBody,
      'eventId': eventId,
      'read': false,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Organizer approves / rejects a registration
  Future<void> updateRegistrationStatus({
    required String eventId,
    required String userId,
    required String status, // 'approved' | 'rejected'
  }) async {
    final eventRef = _db.collection('events').doc(eventId);
    final regRef   = eventRef.collection('registrations').doc(userId);

    await _db.runTransaction((tx) async {
      final regSnap = await tx.get(regRef);
      final currentStatus = regSnap.data()?['status'];
      
      if (currentStatus == status) return;

      tx.update(regRef, {'status': status});
      
      if (status == 'approved' && currentStatus != 'approved') {
        tx.update(eventRef, {'registeredCount': FieldValue.increment(1)});
      } else if (status != 'approved' && currentStatus == 'approved') {
        tx.update(eventRef, {'registeredCount': FieldValue.increment(-1)});
      }
    });

    // Notify participant of approval/rejection
    final notifTitle = status == 'approved' ? 'Registration Approved!' : 'Registration Rejected';
    final notifBody = status == 'approved'
        ? 'Your registration has been approved. You are all set!'
        : 'Your registration request was not approved by the organizer.';
    await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
      'type': status == 'approved' ? 'registration_approved' : 'registration_rejected',
      'title': notifTitle,
      'body': notifBody,
      'eventId': eventId,
      'read': false,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> sendAnnouncement(String eventId, String text) async {
    await _db
        .collection('events')
        .doc(eventId)
        .collection('announcements')
        .add({
      'text': text,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
}

// ── Live announcements stream ──────────────────────────────────────────────
final eventAnnouncementsProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, eventId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('events')
      .doc(eventId)
      .collection('announcements')
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
});

// ── Event registrations stream ─────────────────────────────────────────────
final eventRegistrationsProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, eventId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('events')
      .doc(eventId)
      .collection('registrations')
      .orderBy('registeredAt', descending: true)
      .snapshots()
      .map((snap) => snap.docs.map((d) => d.data()).toList());
});
