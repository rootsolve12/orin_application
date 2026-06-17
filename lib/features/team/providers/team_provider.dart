import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/team_model.dart';

final teamServiceProvider = Provider((ref) {
  return TeamService(ref.watch(firestoreProvider));
});

class TeamService {
  final FirebaseFirestore _db;
  TeamService(this._db);

  Future<String> createTeam({
    required String name,
    required String eventId,
    required String leaderId,
    required String leaderName,
    required int maxSize,
  }) async {
    final teamRef = _db.collection('teams').doc();
    final team = TeamModel(
      id: teamRef.id,
      name: name,
      eventId: eventId,
      leaderId: leaderId,
      memberIds: [leaderId],
      memberNames: {leaderId: leaderName},
      maxSize: maxSize,
      createdAt: DateTime.now(),
    );
    await teamRef.set(team.toFirestore());
    return teamRef.id;
  }

  Future<void> joinTeam({
    required String teamId,
    required String userId,
    required String userName,
  }) async {
    final ref = _db.collection('teams').doc(teamId);
    await _db.runTransaction((tx) async {
      final snap = await tx.get(ref);
      if (!snap.exists) throw Exception('Team not found');

      final data = snap.data()!;
      final memberIds = List<String>.from(data['memberIds'] ?? []);
      final memberNames = Map<String, String>.from(data['memberNames'] ?? {});
      final maxSize = data['maxSize'] as int;

      if (memberIds.length >= maxSize) throw Exception('Team is full');
      if (memberIds.contains(userId)) throw Exception('Already in team');

      memberIds.add(userId);
      memberNames[userId] = userName;

      tx.update(ref, {
        'memberIds': memberIds,
        'memberNames': memberNames,
      });
    });
  }

  Future<void> leaveTeam(String teamId, String userId) async {
    final ref = _db.collection('teams').doc(teamId);
    await _db.runTransaction((tx) async {
      final snap = await tx.get(ref);
      if (!snap.exists) throw Exception('Team not found');

      final data = snap.data()!;
      final memberIds = List<String>.from(data['memberIds'] ?? []);
      final memberNames = Map<String, String>.from(data['memberNames'] ?? {});
      final leaderId = data['leaderId'] as String;

      if (!memberIds.contains(userId)) return;

      if (leaderId == userId) {
        // If leader leaves, delete the team or assign new leader
        if (memberIds.length <= 1) {
          tx.delete(ref);
          return;
        } else {
          // Assign next member as leader
          final nextLeader = memberIds.firstWhere((id) => id != userId);
          tx.update(ref, {'leaderId': nextLeader});
        }
      }

      memberIds.remove(userId);
      memberNames.remove(userId);

      tx.update(ref, {
        'memberIds': memberIds,
        'memberNames': memberNames,
      });
    });
  }

  Future<void> removeMember(String teamId, String leaderId, String targetUserId) async {
    final ref = _db.collection('teams').doc(teamId);
    await _db.runTransaction((tx) async {
      final snap = await tx.get(ref);
      if (!snap.exists) throw Exception('Team not found');

      final data = snap.data()!;
      final memberIds = List<String>.from(data['memberIds'] ?? []);
      final memberNames = Map<String, String>.from(data['memberNames'] ?? {});
      final currentLeaderId = data['leaderId'] as String;

      if (currentLeaderId != leaderId) throw Exception('Only the leader can remove members');
      if (targetUserId == leaderId) throw Exception('Leader cannot be removed');

      memberIds.remove(targetUserId);
      memberNames.remove(targetUserId);

      tx.update(ref, {
        'memberIds': memberIds,
        'memberNames': memberNames,
      });
    });
  }

  Future<void> sendChatMessage({
    required String teamId,
    required String senderId,
    required String senderName,
    required String text,
  }) async {
    await _db
        .collection('teams')
        .doc(teamId)
        .collection('messages')
        .add({
      'senderId': senderId,
      'senderName': senderName,
      'text': text,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // New Mission Control Methods
  Future<void> addTask(String teamId, Map<String, dynamic> taskData) async {
    final taskObj = {
      'id': 'task_${DateTime.now().millisecondsSinceEpoch}',
      ...taskData,
      'createdAt': DateTime.now().toIso8601String(),
    };
    await _db.collection('teams').doc(teamId).update({
      'tasks': FieldValue.arrayUnion([taskObj])
    });
  }

  Future<void> updateTaskStatus(String teamId, List<Map<String, dynamic>> updatedTasks) async {
    await _db.collection('teams').doc(teamId).update({
      'tasks': updatedTasks,
    });
  }

  Future<void> addLink(String teamId, Map<String, dynamic> linkData) async {
    final linkObj = {
      'id': 'link_${DateTime.now().millisecondsSinceEpoch}',
      ...linkData,
      'createdAt': DateTime.now().toIso8601String(),
    };
    await _db.collection('teams').doc(teamId).update({
      'links': FieldValue.arrayUnion([linkObj])
    });
  }
}

// ── Stream user's teams ────────────────────────────────────────────────────
final userTeamsStreamProvider = StreamProvider.family<List<TeamModel>, String>((ref, userId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('teams')
      .where('memberIds', arrayContains: userId)
      .snapshots()
      .map((snap) => snap.docs.map(TeamModel.fromFirestore).toList());
});

// ── Stream event's teams ───────────────────────────────────────────────────
final eventTeamsStreamProvider = StreamProvider.family<List<TeamModel>, String>((ref, eventId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('teams')
      .where('eventId', isEqualTo: eventId)
      .snapshots()
      .map((snap) => snap.docs.map(TeamModel.fromFirestore).toList());
});

// ── Stream team details ────────────────────────────────────────────────────
final singleTeamProvider = StreamProvider.family<TeamModel?, String>((ref, teamId) {
  final db = ref.watch(firestoreProvider);
  return db.collection('teams').doc(teamId).snapshots().map((doc) =>
      doc.exists ? TeamModel.fromFirestore(doc) : null);
});

// ── Chat message model ─────────────────────────────────────────────────────
class TeamMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final DateTime createdAt;

  TeamMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.createdAt,
  });

  factory TeamMessage.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return TeamMessage(
      id: doc.id,
      senderId: d['senderId'] ?? '',
      senderName: d['senderName'] ?? '',
      text: d['text'] ?? '',
      createdAt: (d['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}

// ── Stream team chat messages ──────────────────────────────────────────────
final teamChatStreamProvider = StreamProvider.family<List<TeamMessage>, String>((ref, teamId) {
  final db = ref.watch(firestoreProvider);
  return db
      .collection('teams')
      .doc(teamId)
      .collection('messages')
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((snap) => snap.docs.map(TeamMessage.fromFirestore).toList());
});
