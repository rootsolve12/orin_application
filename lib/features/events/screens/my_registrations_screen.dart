import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/events_provider.dart';
import '../models/event_model.dart';
import '../models/event_category_meta.dart';

class MyRegistrationsScreen extends ConsumerStatefulWidget {
  const MyRegistrationsScreen({super.key});

  @override
  ConsumerState<MyRegistrationsScreen> createState() => _MyRegistrationsScreenState();
}

class _MyRegistrationsScreenState extends ConsumerState<MyRegistrationsScreen>
    with SingleTickerProviderStateMixin {
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
    if (user == null) return const SizedBox();

    final registrations = ref.watch(userRegistrationsProvider(user.uid));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('MY REGISTRATIONS', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: OrinColors.primary,
          labelColor: OrinColors.text,
          unselectedLabelColor: OrinColors.muted,
          labelStyle: GoogleFonts.syne(fontSize: 11, fontWeight: FontWeight.w800),
          tabs: const [
            Tab(text: 'UPCOMING'),
            Tab(text: 'PAST'),
          ],
        ),
      ),
      body: OrinGridBg(
        child: registrations.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.accent)),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (list) {
            final now = DateTime.now();

            final upcoming = list.where((item) {
              final event = item['event'] as EventModel;
              return event.endDate.isAfter(now);
            }).toList();

            final past = list.where((item) {
              final event = item['event'] as EventModel;
              return !event.endDate.isAfter(now);
            }).toList();

            return TabBarView(
              controller: _tabController,
              children: [
                _RegistrationList(items: upcoming, emptyMessage: 'No upcoming registrations', emptySubtitle: 'Register for events to see them here'),
                _RegistrationList(items: past, emptyMessage: 'No past events', emptySubtitle: 'Completed events will appear here'),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _RegistrationList extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final String emptyMessage;
  final String emptySubtitle;

  const _RegistrationList({
    required this.items,
    required this.emptyMessage,
    required this.emptySubtitle,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.confirmation_number_outlined, size: 56, color: OrinColors.dim),
            const SizedBox(height: 16),
            Text(emptyMessage,
                style: GoogleFonts.syne(fontSize: 18, fontWeight: FontWeight.w700, color: OrinColors.muted)),
            const SizedBox(height: 8),
            Text(emptySubtitle,
                style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.dim)),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: () => context.go('/feed'),
              child: const Text('EXPLORE EVENTS'),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (ctx, i) {
        final item = items[i];
        final event = item['event'] as EventModel;
        final reg = item['registration'] as Map<String, dynamic>;
        final status = reg['status'] as String? ?? 'pending';
        final isAttending = reg['attendance'] == true;
        return _RegistrationCard(event: event, status: status, isAttending: isAttending);
      },
    );
  }
}

class _RegistrationCard extends StatelessWidget {
  final EventModel event;
  final String status;
  final bool isAttending;

  const _RegistrationCard({required this.event, required this.status, required this.isAttending});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isPast = !event.endDate.isAfter(now);

    final statusColor = switch (status) {
      'approved' => OrinColors.accentTeal,
      'pending' => OrinColors.accent2,
      'rejected' => Colors.redAccent,
      _ => OrinColors.muted,
    };

    return InkWell(
      onTap: () => context.push('/event/${event.id}'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: OrinColors.surface,
          border: Border.all(color: OrinColors.border2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category accent bar
                Container(
                  width: 3,
                  height: 44,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: event.category.accent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.category.label.toUpperCase(),
                        style: GoogleFonts.dmMono(fontSize: 9, color: event.category.accent, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        event.title,
                        style: GoogleFonts.syne(fontSize: 15, fontWeight: FontWeight.w700, color: OrinColors.text),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        event.institution,
                        style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.muted),
                      ),
                    ],
                  ),
                ),
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: GoogleFonts.dmMono(fontSize: 9, fontWeight: FontWeight.w700, color: statusColor),
                  ),
                ),
              ],
            ),
            if (isPast && status == 'approved') ...[
              const SizedBox(height: 10),
              const Divider(color: OrinColors.border, height: 1),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(
                    isAttending ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                    size: 14,
                    color: isAttending ? OrinColors.secondary : OrinColors.dim,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isAttending ? 'ATTENDED' : 'DID NOT ATTEND',
                    style: GoogleFonts.dmMono(
                      fontSize: 9,
                      color: isAttending ? OrinColors.secondary : OrinColors.dim,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
