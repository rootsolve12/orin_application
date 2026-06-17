import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/event_model.dart';
import '../providers/events_provider.dart';

class OrganizerDashboardScreen extends ConsumerStatefulWidget {
  const OrganizerDashboardScreen({super.key});

  @override
  ConsumerState<OrganizerDashboardScreen> createState() => _OrganizerDashboardScreenState();
}

class _OrganizerDashboardScreenState extends ConsumerState<OrganizerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) return const Scaffold(body: Center(child: Text('Please log in')));

    final eventsAsync = ref.watch(organizerEventsProvider(user.uid));

    return Scaffold(
      backgroundColor: OrinColors.bgLight,
      body: SafeArea(
        child: eventsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.inter(color: Colors.redAccent))),
          data: (events) {
            final activeEvents = events.where((e) => e.state == EventState.open || e.state == EventState.ongoing || e.state == EventState.draft).toList();
            final pastEvents = events.where((e) => e.state == EventState.completed || e.state == EventState.cancelled).toList();

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Area
                Padding(
                  padding: const EdgeInsets.fromLTRB(40, 40, 40, 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Organizer Tools', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.textLight)),
                          const SizedBox(height: 4),
                          Text('Create and manage your events', style: GoogleFonts.inter(fontSize: 15, color: OrinColors.mutedLight)),
                        ],
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(140, 48),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                        ),
                        onPressed: () => context.push('/create-event'),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Create Event'),
                      ),
                    ],
                  ),
                ),

                // Tabs
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Container(
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: OrinColors.borderLight, width: 2)),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicatorColor: OrinColors.primary,
                      indicatorWeight: 3,
                      labelColor: OrinColors.primary,
                      unselectedLabelColor: OrinColors.mutedLight,
                      labelStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                      tabs: const [
                        Tab(text: 'Active Events'),
                        Tab(text: 'Past Events'),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),

                // List View
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _EventList(events: activeEvents, type: 'active'),
                      _EventList(events: pastEvents, type: 'past'),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _EventList extends StatelessWidget {
  final List<EventModel> events;
  final String type;

  const _EventList({required this.events, required this.type});

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_busy_outlined, size: 48, color: OrinColors.mutedLight.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text('No $type events found', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: OrinColors.mutedLight)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
      itemCount: events.length,
      itemBuilder: (ctx, i) => _EventManageCard(event: events[i]),
    );
  }
}

class _EventManageCard extends ConsumerWidget {
  final EventModel event;
  const _EventManageCard({required this.event});

  void _showManageSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _ParticipantsSheet(event: event),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: OrinColors.borderLight),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: OrinColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.flash_on_rounded, color: OrinColors.primary),
          ),
          const SizedBox(width: 24),
          
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: OrinColors.textLight),
                ),
                const SizedBox(height: 4),
                Text(
                  '${event.category} • ${event.state.name.toUpperCase()}',
                  style: GoogleFonts.inter(fontSize: 13, color: OrinColors.mutedLight),
                ),
              ],
            ),
          ),
          
          // Stats
          Row(
            children: [
              const Icon(Icons.people_outline, size: 18, color: OrinColors.mutedLight),
              const SizedBox(width: 8),
              Text(
                '${event.registeredCount} Users',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.textLight),
              ),
            ],
          ),
          
          const SizedBox(width: 32),
          
          // Manage Button
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(100, 40),
              padding: const EdgeInsets.symmetric(horizontal: 24),
            ),
            onPressed: () => _showManageSheet(context, ref),
            child: const Text('Manage'),
          ),
        ],
      ),
    );
  }
}

class _ParticipantsSheet extends ConsumerStatefulWidget {
  final EventModel event;
  const _ParticipantsSheet({required this.event});

  @override
  ConsumerState<_ParticipantsSheet> createState() => _ParticipantsSheetState();
}

class _ParticipantsSheetState extends ConsumerState<_ParticipantsSheet> {
  final _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _changeState(WidgetRef ref, EventState newState) async {
    await ref.read(eventServiceProvider).updateEvent(widget.event.id, {'state': newState.name});
    if (mounted) Navigator.pop(context);
  }

  Future<void> _exportCsv(List<Map<String, dynamic>> registrations) async {
    try {
      final List<List<dynamic>> rows = [
        ['Name', 'Institution', 'Status', 'Attendance']
      ];
      for (final r in registrations) {
        rows.add([
          r['userName'] ?? 'Unknown',
          r['institution'] ?? 'N/A',
          r['status'] ?? 'pending',
          (r['attendance'] == true) ? 'Present' : 'Absent',
        ]);
      }
      final csvString = const ListToCsvConverter().convert(rows);
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/participants_${widget.event.id}.csv');
      await file.writeAsString(csvString);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('CSV exported successfully: ${file.path}'),
            backgroundColor: OrinColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Future<void> _toggleAttendance(String userId, bool currentVal) async {
    await ref.read(firestoreProvider)
        .collection('events')
        .doc(widget.event.id)
        .collection('registrations')
        .doc(userId)
        .update({'attendance': !currentVal});
  }

  @override
  Widget build(BuildContext context) {
    final regsAsync = ref.watch(eventRegistrationsProvider(widget.event.id));

    return FractionallySizedBox(
      heightFactor: 0.85,
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Manage Event',
                  style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: OrinColors.textLight),
                ),
                Row(
                  children: [
                    DropdownButton<EventState>(
                      value: widget.event.state,
                      dropdownColor: Colors.white,
                      underline: const SizedBox(),
                      icon: const Icon(Icons.arrow_drop_down, color: OrinColors.mutedLight),
                      onChanged: (val) {
                        if (val != null) _changeState(ref, val);
                      },
                      items: EventState.values.map((s) {
                        return DropdownMenuItem(
                          value: s,
                          child: Text(s.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: OrinColors.textLight)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(width: 16),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, color: OrinColors.textLight),
                      onPressed: () {
                        Navigator.pop(context);
                        context.push('/edit-event/${widget.event.id}');
                      },
                      tooltip: 'Edit Event Details',
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _search = v.toLowerCase()),
                    decoration: InputDecoration(
                      hintText: 'Search participant by name...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      fillColor: OrinColors.bgLight,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                regsAsync.when(
                  loading: () => const SizedBox(),
                  error: (_, __) => const SizedBox(),
                  data: (list) => OutlinedButton.icon(
                    icon: const Icon(Icons.download_rounded, size: 18),
                    label: const Text('Export CSV'),
                    onPressed: () => _exportCsv(list),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _PendingApprovalsSection(eventId: widget.event.id),
            const SizedBox(height: 16),
            Expanded(
              child: regsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (list) {
                  final filtered = list.where((r) {
                    final name = (r['userName'] as String? ?? '').toLowerCase();
                    return name.contains(_search);
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Text('No participants found.', style: GoogleFonts.inter(fontSize: 14, color: OrinColors.mutedLight)),
                    );
                  }

                  return ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final reg = filtered[i];
                      final name = reg['userName'] ?? 'Unknown';
                      final inst = reg['institution'] ?? 'N/A';
                      final status = reg['status'] ?? 'pending';
                      final isPresent = reg['attendance'] == true;
                      final uId = reg['userId'] as String? ?? '';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: OrinColors.bgLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: OrinColors.borderLight),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: OrinColors.primary.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: OrinColors.primary),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: OrinColors.textLight)),
                                  Text(inst, style: GoogleFonts.inter(fontSize: 13, color: OrinColors.mutedLight)),
                                ],
                              ),
                            ),
                            if (status == 'approved') ...[
                              Text('Attendance', style: GoogleFonts.inter(fontSize: 13, color: OrinColors.mutedLight)),
                              const SizedBox(width: 8),
                              Switch(
                                value: isPresent,
                                activeColor: OrinColors.primary,
                                onChanged: (val) {
                                  if (uId.isNotEmpty) _toggleAttendance(uId, isPresent);
                                },
                              ),
                            ] else ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.orange.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(status.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.orange)),
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingApprovalsSection extends ConsumerWidget {
  final String eventId;
  const _PendingApprovalsSection({required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('events').doc(eventId)
          .collection('registrations')
          .where('status', isEqualTo: 'pending')
          .limit(5)
          .snapshots(),
      builder: (_, snap) {
        if (!snap.hasData || snap.data!.docs.isEmpty) {
          return const SizedBox.shrink();
        }
        final docs = snap.data!.docs;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pending Approvals (${docs.length})',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.textLight)),
            const SizedBox(height: 12),
            ...docs.map((doc) {
              final d = doc.data() as Map<String, dynamic>;
              return _ApprovalRow(
                eventId: eventId,
                userId: doc.id,
                name: d['userName'] ?? 'Unknown',
                institution: d['institution'] ?? '',
              );
            }),
            const Divider(height: 32, color: OrinColors.borderLight),
          ],
        );
      },
    );
  }
}

class _ApprovalRow extends ConsumerWidget {
  final String eventId, userId, name, institution;
  const _ApprovalRow({
    required this.eventId,
    required this.userId,
    required this.name,
    required this.institution,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.05),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.textLight)),
                Text(institution, style: GoogleFonts.inter(fontSize: 12, color: OrinColors.mutedLight)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.check_circle_outline, color: Colors.green),
            tooltip: 'Approve',
            onPressed: () => ref.read(eventServiceProvider).updateRegistrationStatus(eventId: eventId, userId: userId, status: 'approved'),
          ),
          IconButton(
            icon: const Icon(Icons.cancel_outlined, color: Colors.red),
            tooltip: 'Reject',
            onPressed: () => ref.read(eventServiceProvider).updateRegistrationStatus(eventId: eventId, userId: userId, status: 'rejected'),
          ),
        ],
      ),
    );
  }
}