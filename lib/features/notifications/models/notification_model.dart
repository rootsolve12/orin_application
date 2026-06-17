import 'package:cloud_firestore/cloud_firestore.dart';

class NotificationModel {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? eventId;
  final bool read;
  final DateTime createdAt;

  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.eventId,
    required this.read,
    required this.createdAt,
  });

  factory NotificationModel.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return NotificationModel(
      id: doc.id,
      type: d['type'] ?? 'info',
      title: d['title'] ?? '',
      body: d['body'] ?? '',
      eventId: d['eventId'],
      read: d['read'] ?? false,
      createdAt: (d['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() => {
    'type': type,
    'title': title,
    'body': body,
    'eventId': eventId,
    'read': read,
    'createdAt': Timestamp.fromDate(createdAt),
  };
}
