import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/notification_model.dart';

final notificationsServiceProvider = Provider((ref) {
  return NotificationsService(ref.watch(firestoreProvider));
});

class NotificationsService {
  final FirebaseFirestore _db;
  NotificationsService(this._db);

  Future<void> markAsRead(String userId, String notificationId) async {
    await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .update({'read': true});
  }

  Future<void> deleteNotification(String userId, String notificationId) async {
    await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .delete();
  }

  Future<void> clearAll(String userId) async {
    final batch = _db.batch();
    final snap = await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .get();

    for (var doc in snap.docs) {
      batch.delete(doc.reference);
    }
    await batch.commit();
  }

  Future<void> sendNotification({
    required String userId,
    required String type,
    required String title,
    required String body,
    String? eventId,
  }) async {
    await _db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
      'type': type,
      'title': title,
      'body': body,
      'eventId': eventId,
      'read': false,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
}

// ── Streams notifications list ─────────────────────────────────────────────
final userNotificationsProvider = StreamProvider.family<List<NotificationModel>, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((snap) =>
          snap.docs.map(NotificationModel.fromFirestore).toList());
});

// ── Unread notifications count ─────────────────────────────────────────────
final unreadNotificationsCountProvider = StreamProvider.family<int, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', isEqualTo: false)
      .snapshots()
      .map((snap) => snap.docs.length);
});
