import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/event_model.dart';

// ── Bookmark toggle ────────────────────────────────────────────────────────
final bookmarkServiceProvider = Provider((ref) {
  return BookmarkService(ref.watch(firestoreProvider));
});

class BookmarkService {
  final FirebaseFirestore _db;
  BookmarkService(this._db);

  Future<void> toggleBookmark(String userId, String eventId) async {
    final ref = _db.collection('users').doc(userId).collection('bookmarks').doc(eventId);
    final snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
    } else {
      await ref.set({'eventId': eventId, 'savedAt': FieldValue.serverTimestamp()});
    }
  }

  Stream<bool> isBookmarked(String userId, String eventId) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('bookmarks')
        .doc(eventId)
        .snapshots()
        .map((snap) => snap.exists);
  }
}

// ── Bookmarked event IDs stream ────────────────────────────────────────────
final bookmarkedIdsProvider = StreamProvider.family<Set<String>, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('users')
      .doc(userId)
      .collection('bookmarks')
      .snapshots()
      .map((snap) => snap.docs.map((d) => d.id).toSet());
});

// ── Is single event bookmarked ─────────────────────────────────────────────
final isBookmarkedProvider = StreamProvider.family<bool, ({String userId, String eventId})>((ref, params) {
  return ref.watch(bookmarkServiceProvider).isBookmarked(params.userId, params.eventId);
});

// ── Bookmarked events list ─────────────────────────────────────────────────
final bookmarkedEventsProvider = StreamProvider.family<List<EventModel>, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('users')
      .doc(userId)
      .collection('bookmarks')
      .orderBy('savedAt', descending: true)
      .snapshots()
      .asyncMap((snap) async {
    final events = <EventModel>[];
    for (final doc in snap.docs) {
      final eventDoc = await db.collection('events').doc(doc.id).get();
      if (eventDoc.exists) {
        events.add(EventModel.fromFirestore(eventDoc));
      }
    }
    return events;
  });
});
