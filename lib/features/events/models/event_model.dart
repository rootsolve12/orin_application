import 'package:cloud_firestore/cloud_firestore.dart';

enum EventCategory { hackathon, cultural, technical, sports, workshop, other }
enum EventMode { offline, online, hybrid }
enum EventState { draft, open, ongoing, completed, cancelled }
enum ParticipationMode { individual, team, both }

class EventModel {
  final String id;
  final String title;
  final String description;
  final String organizerId;
  final String organizerName;
  final String institution;
  final EventCategory category;
  final EventMode mode;
  final EventState state;
  final ParticipationMode participationMode;
  final List<String> tags;
  final String? venue;
  final DateTime startDate;
  final DateTime endDate;
  final DateTime registrationDeadline;
  final int capacity;
  final int registeredCount;
  final bool approvalRequired;
  final bool openToOtherColleges;
  final String? prize;
  final String? eligibility;
  final int? minTeamSize;
  final int? maxTeamSize;
  final String? bannerUrl;
  final double? latitude;
  final double? longitude;
  final List<Map<String, dynamic>>? timeline;
  final DateTime createdAt;

  const EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.organizerId,
    required this.organizerName,
    required this.institution,
    required this.category,
    required this.mode,
    required this.state,
    required this.participationMode,
    required this.tags,
    this.venue,
    required this.startDate,
    required this.endDate,
    required this.registrationDeadline,
    required this.capacity,
    required this.registeredCount,
    required this.approvalRequired,
    required this.openToOtherColleges,
    this.prize,
    this.eligibility,
    this.minTeamSize,
    this.maxTeamSize,
    this.bannerUrl,
    this.latitude,
    this.longitude,
    this.timeline,
    required this.createdAt,
  });

  double get fillPercent =>
      capacity > 0 ? (registeredCount / capacity).clamp(0.0, 1.0) : 0.0;

  bool get isOpen => state == EventState.open &&
      DateTime.now().isBefore(registrationDeadline);

  factory EventModel.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return EventModel(
      id:                   doc.id,
      title:                d['title'] ?? '',
      description:          d['description'] ?? '',
      organizerId:          d['organizerId'] ?? '',
      organizerName:        d['organizerName'] ?? '',
      institution:          d['institution'] ?? '',
      category:             EventCategory.values.firstWhere(
              (e) => e.name == d['category'],
          orElse: () => EventCategory.other),
      mode:                 EventMode.values.firstWhere(
              (e) => e.name == d['mode'],
          orElse: () => EventMode.offline),
      state:                EventState.values.firstWhere(
              (e) => e.name == d['state'],
          orElse: () => EventState.draft),
      participationMode:    ParticipationMode.values.firstWhere(
              (e) => e.name == d['participationMode'],
          orElse: () => ParticipationMode.individual),
      tags:                 List<String>.from(d['tags'] ?? []),
      venue:                d['venue'],
      startDate:            (d['startDate'] as Timestamp).toDate(),
      endDate:              (d['endDate'] as Timestamp).toDate(),
      registrationDeadline: (d['registrationDeadline'] as Timestamp).toDate(),
      capacity:             d['capacity'] ?? 100,
      registeredCount:      d['registeredCount'] ?? 0,
      approvalRequired:     d['approvalRequired'] ?? false,
      openToOtherColleges:  d['openToOtherColleges'] ?? true,
      prize:                d['prize'],
      eligibility:          d['eligibility'],
      minTeamSize:          d['minTeamSize'],
      maxTeamSize:          d['maxTeamSize'],
      bannerUrl:            d['bannerUrl'],
      latitude:             d['latitude']?.toDouble(),
      longitude:            d['longitude']?.toDouble(),
      timeline:             d['timeline'] != null ? List<Map<String, dynamic>>.from(d['timeline']) : null,
      createdAt:            (d['createdAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() => {
    'title':                title,
    'description':          description,
    'organizerId':          organizerId,
    'organizerName':        organizerName,
    'institution':          institution,
    'category':             category.name,
    'mode':                 mode.name,
    'state':                state.name,
    'participationMode':    participationMode.name,
    'tags':                 tags,
    'venue':                venue,
    'startDate':            Timestamp.fromDate(startDate),
    'endDate':              Timestamp.fromDate(endDate),
    'registrationDeadline': Timestamp.fromDate(registrationDeadline),
    'capacity':             capacity,
    'registeredCount':      registeredCount,
    'approvalRequired':     approvalRequired,
    'openToOtherColleges':  openToOtherColleges,
    'prize':                prize,
    'eligibility':          eligibility,
    'minTeamSize':          minTeamSize,
    'maxTeamSize':          maxTeamSize,
    'bannerUrl':            bannerUrl,
    'latitude':             latitude,
    'longitude':            longitude,
    'timeline':             timeline,
    'createdAt':            FieldValue.serverTimestamp(),
  };
}