import 'package:cloud_firestore/cloud_firestore.dart';

class TeamModel {
  final String id;
  final String name;
  final String eventId;
  final String leaderId;
  final List<String> memberIds;
  final Map<String, String> memberNames;
  final int maxSize;
  final DateTime createdAt;
  
  // New Mission Control fields
  final List<Map<String, dynamic>> tasks;
  final List<Map<String, dynamic>> links;
  final String? inviteCode;

  const TeamModel({
    required this.id,
    required this.name,
    required this.eventId,
    required this.leaderId,
    required this.memberIds,
    required this.memberNames,
    required this.maxSize,
    required this.createdAt,
    this.tasks = const [],
    this.links = const [],
    this.inviteCode,
  });

  factory TeamModel.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return TeamModel(
      id: doc.id,
      name: d['name'] ?? '',
      eventId: d['eventId'] ?? '',
      leaderId: d['leaderId'] ?? '',
      memberIds: List<String>.from(d['memberIds'] ?? []),
      memberNames: Map<String, String>.from(d['memberNames'] ?? {}),
      maxSize: d['maxSize'] ?? 4,
      createdAt: (d['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      tasks: List<Map<String, dynamic>>.from(d['tasks'] ?? []),
      links: List<Map<String, dynamic>>.from(d['links'] ?? []),
      inviteCode: d['inviteCode'],
    );
  }

  Map<String, dynamic> toFirestore() => {
    'name': name,
    'eventId': eventId,
    'leaderId': leaderId,
    'memberIds': memberIds,
    'memberNames': memberNames,
    'maxSize': maxSize,
    'createdAt': Timestamp.fromDate(createdAt),
    'tasks': tasks,
    'links': links,
    if (inviteCode != null) 'inviteCode': inviteCode,
  };
}

