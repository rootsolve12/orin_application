import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final aiServiceProvider = Provider((ref) => AiService());

class AiService {
  final _fn = FirebaseFunctions.instance;

  // Feature 1 — Generate event description
  Future<String> generateDescription({
    required String title,
    required String category,
    required String mode,
    String? prize,
    List<String>? tags,
  }) async {
    final result = await _fn
        .httpsCallable('generateEventDescription')
        .call({
      'title': title, 'category': category,
      'mode': mode, 'prize': prize, 'tags': tags,
    });
    return result.data['description'] as String;
  }

  // Feature 2 — Extract tags
  Future<List<String>> extractTags({
    required String title,
    required String description,
    required String category,
  }) async {
    final result = await _fn
        .httpsCallable('extractEventTags')
        .call({
      'title': title,
      'description': description,
      'category': category,
    });
    return List<String>.from(result.data['tags'] ?? []);
  }

  // Feature 3 — Get event summary
  Future<String> getEventSummary({
    required String eventId,
    required String title,
    required String description,
    required String category,
    String? prize,
  }) async {
    final result = await _fn
        .httpsCallable('generateEventSummary')
        .call({
      'eventId': eventId, 'title': title,
      'description': description, 'category': category,
      'prize': prize,
    });
    return result.data['summary'] as String;
  }

  // Feature 4 — Personalized feed
  Future<List<String>> getPersonalizedFeed(String userId) async {
    final result = await _fn
        .httpsCallable('getPersonalizedFeed')
        .call({'userId': userId});
    return List<String>.from(result.data['rankedIds'] ?? []);
  }

  // Feature 5 — Natural language search
  Future<List<String>> naturalLanguageSearch(String query) async {
    final result = await _fn
        .httpsCallable('naturalLanguageSearch')
        .call({'query': query});
    return List<String>.from(result.data['eventIds'] ?? []);
  }

  // Feature 6 — Chatbot
  Future<String> chat({
    required List<Map<String, String>> messages,
    required String userId,
    String? currentEventId,
  }) async {
    final result = await _fn
        .httpsCallable('chatWithOrin')
        .call({
      'messages': messages,
      'userId': userId,
      'currentEventId': currentEventId,
    });
    return result.data['reply'] as String;
  }

  // Feature 7 — Score coordinator applicant
  Future<Map<String, dynamic>> scoreApplicant({
    required Map<String, dynamic> applicant,
    required String roleRequirements,
  }) async {
    final result = await _fn
        .httpsCallable('scoreCoordinatorApplicant')
        .call({
      'applicant': applicant,
      'roleRequirements': roleRequirements,
    });
    return Map<String, dynamic>.from(result.data);
  }
}