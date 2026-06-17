import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/event_category_meta.dart';
import '../models/event_model.dart';
import '../providers/bookmarks_provider.dart';
import '../providers/events_provider.dart';
import '../../../core/utils/validators.dart';

class EventDetailScreen extends ConsumerWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventAsync = ref.watch(singleEventProvider(eventId));

    return eventAsync.when(
      loading: () => const Scaffold(
          backgroundColor: OrinColors.bg,
          body: Center(child: CircularProgressIndicator(color: OrinColors.accent))),
      error: (e, _) => Scaffold(
          backgroundColor: OrinColors.bg,
          body: Center(
              child: Text('Error loading event',
                  style: GoogleFonts.dmMono(color: OrinColors.muted)))),
      data: (event) {
        if (event == null) {
          return Scaffold(
              backgroundColor: OrinColors.bg,
              body: Center(
                  child: Text('Event not found',
                      style: GoogleFonts.dmMono(color: OrinColors.muted))));
        }
        return _EventDetailView(event: event);
      },
    );
  }
}

class _EventDetailView extends ConsumerStatefulWidget {
  final EventModel event;
  const _EventDetailView({required this.event});

  @override
  ConsumerState<_EventDetailView> createState() => _EventDetailViewState();
}

class _EventDetailViewState extends ConsumerState<_EventDetailView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _registering = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showConfirmationSheet(bool approvalRequired, String eventTitle, DateTime startDate) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RegistrationConfirmSheet(
        eventTitle: eventTitle,
        startDate: startDate,
        approvalRequired: approvalRequired,
      ),
    );
  }

  Future<void> _register() async {
    final user = ref.read(authServiceProvider).currentUser;
    if (user == null) return;

    final userData = ref.read(userDocProvider).valueOrNull?.data() as Map<String, dynamic>?;
    final userInst = userData?['institution'] as String? ?? '';
    final userName = userData != null ? '${userData['firstName']} ${userData['lastName']}' : (user.displayName ?? user.email ?? 'Unknown');

    // Institution restriction check
    if (!widget.event.openToOtherColleges) {
      if (userInst.toLowerCase().trim() != widget.event.institution.toLowerCase().trim()) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('Registration restricted. This event is only open to students of ${widget.event.institution}.',
              style: GoogleFonts.dmMono(color: Colors.white)),
        ));
        return;
      }
      
      final email = user.email ?? '';
      if (!OrinValidators.isCollegeEmail(email) && !email.toLowerCase().endsWith(widget.event.institution.toLowerCase().replaceAll(' ', ''))) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('Registration restricted. A verified institutional email is required.',
              style: GoogleFonts.dmMono(color: Colors.white)),
        ));
        return;
      }
    }

    setState(() => _registering = true);
    try {
      await ref.read(eventServiceProvider).registerForEvent(
            eventId: widget.event.id,
            userId: user.uid,
            userName: userName,
            userInstitution: userInst.isNotEmpty ? userInst : 'Unknown College',
            approvalRequired: widget.event.approvalRequired,
          );
      if (mounted) {
        _showConfirmationSheet(
          widget.event.approvalRequired,
          widget.event.title,
          widget.event.startDate,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text(e.toString().replaceAll('Exception: ', ''),
              style: GoogleFonts.dmMono(color: Colors.white)),
        ));
      }
    } finally {
      if (mounted) setState(() => _registering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.event;
    final user = ref.watch(authStateProvider).valueOrNull;

    final isBookmarked = user == null
        ? false
        : ref.watch(isBookmarkedProvider((userId: user.uid, eventId: e.id))).valueOrNull ?? false;

    // Status label/color
    final now = DateTime.now();
    final String statusLabel;
    final Color statusColor;
    if (e.state == EventState.cancelled) {
      statusLabel = 'CANCELLED';
      statusColor = Colors.redAccent;
    } else if (e.state == EventState.completed || now.isAfter(e.endDate)) {
      statusLabel = 'COMPLETED';
      statusColor = OrinColors.muted;
    } else if (now.isAfter(e.startDate) && now.isBefore(e.endDate)) {
      statusLabel = 'ONGOING';
      statusColor = OrinColors.secondary;
    } else if (now.isAfter(e.registrationDeadline)) {
      statusLabel = 'REG CLOSED';
      statusColor = OrinColors.neonOrange;
    } else {
      statusLabel = 'OPEN';
      statusColor = OrinColors.accentTeal;
    }

    return Scaffold(
      backgroundColor: OrinColors.bg,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: OrinColors.bg,
            leading: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: OrinColors.surface.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.arrow_back, color: OrinColors.text, size: 20),
              ),
            ),
            actions: [
              if (user != null)
                IconButton(
                  icon: Icon(
                    isBookmarked ? Icons.bookmark : Icons.bookmark_border_outlined,
                    color: isBookmarked ? OrinColors.primary : OrinColors.text,
                    size: 20,
                  ),
                  onPressed: () {
                    ref.read(bookmarkServiceProvider).toggleBookmark(user.uid, e.id);
                  },
                ),
              IconButton(
                icon: const Icon(Icons.share_outlined, color: OrinColors.text, size: 20),
                onPressed: () {
                  Share.share(
                    'Check out this college event: ${e.title}\nCategory: ${e.category.name}\nInstitution: ${e.institution}\nRegister here: https://orin.app/event/${e.id}',
                  );
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  color: e.category.accent.withValues(alpha: 0.08),
                  image: e.bannerUrl != null
                      ? DecorationImage(
                          image: NetworkImage(e.bannerUrl!),
                          fit: BoxFit.cover,
                          colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.5), BlendMode.darken),
                        )
                      : null,
                ),
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        OrinTag(e.category.shortLabel, color: e.category.accent),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            statusLabel,
                            style: GoogleFonts.dmMono(fontSize: 10, fontWeight: FontWeight.w800, color: statusColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    e.title,
                    style: GoogleFonts.syne(fontSize: 26, fontWeight: FontWeight.w800, color: OrinColors.text),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'by ${e.organizerName} · ${e.institution}',
                    style: GoogleFonts.dmMono(fontSize: 11, color: OrinColors.muted),
                  ),
                  const SizedBox(height: 16),
                  TabBar(
                    controller: _tabController,
                    indicatorColor: OrinColors.primary,
                    labelColor: OrinColors.text,
                    unselectedLabelColor: OrinColors.muted,
                    labelStyle: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w800),
                    unselectedLabelStyle: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w500),
                    tabs: const [
                      Tab(text: 'INFO'),
                      Tab(text: 'ALERTS'),
                      Tab(text: 'PARTICIPANTS'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _InfoTab(event: e, registering: _registering, onRegister: _register),
            _AnnouncementsTab(eventId: e.id),
            _ParticipantsTab(eventId: e.id),
          ],
        ),
      ),
    );
  }
}

class _InfoTab extends ConsumerWidget {
  final EventModel event;
  final bool registering;
  final VoidCallback onRegister;

  const _InfoTab({required this.event, required this.registering, required this.onRegister});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final e = event;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Info pills
          Wrap(spacing: 8, runSpacing: 8, children: [
            _Pill(e.mode.label),
            if (e.venue != null) _Pill('📍 ${e.venue}'),
            if (e.prize != null) _Pill('🏆 ${e.prize}'),
            _Pill(e.participationMode == ParticipationMode.team
                ? '👥 Team ${e.minTeamSize}–${e.maxTeamSize}'
                : '👤 Individual'),
            if (e.openToOtherColleges) _Pill('🌐 Open to all') else _Pill('🔒 Restricted'),
          ]),
          const SizedBox(height: 24),

          // About Section
          Text('ABOUT EVENT', style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: OrinColors.text)),
          const SizedBox(height: 8),
          Text(
            e.description,
            style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.muted, height: 1.7),
          ),
          const SizedBox(height: 24),

          // Eligibility Section
          if (e.eligibility != null) ...[
            Text('ELIGIBILITY', style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: OrinColors.text)),
            const SizedBox(height: 8),
            Text(
              e.eligibility!,
              style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.muted, height: 1.6),
            ),
            const SizedBox(height: 24),
          ],

          // Organizer Profile Card
          Text('ORGANIZER', style: GoogleFonts.syne(fontSize: 13, fontWeight: FontWeight.w800, color: OrinColors.text)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: OrinColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: OrinColors.border2),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: OrinColors.primary.withValues(alpha: 0.1),
                  child: Text(e.organizerName.isNotEmpty ? e.organizerName[0].toUpperCase() : '?',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: OrinColors.primary)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.organizerName, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: OrinColors.text)),
                      Text(e.institution, style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Registration progress
          Container(
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('REGISTRATION', style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.muted)),
                    Text('${e.registeredCount} / ${e.capacity}',
                        style: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w800, color: e.category.accent)),
                  ],
                ),
                const SizedBox(height: 8),
                LinearPercentIndicator(
                  padding: EdgeInsets.zero,
                  lineHeight: 6,
                  percent: e.fillPercent,
                  backgroundColor: OrinColors.border,
                  progressColor: e.category.accent,
                  barRadius: const Radius.circular(3),
                ),
                const SizedBox(height: 8),
                Text(
                  'Closes ${timeago.format(e.registrationDeadline, allowFromNow: true)}',
                  style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.dim),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Team support CTA buttons
          if (e.isOpen && (e.participationMode == ParticipationMode.team || e.participationMode == ParticipationMode.both)) ...[
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.push('/create-team/${e.id}'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: OrinColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('CREATE TEAM'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.push('/join-team/${e.id}'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: OrinColors.secondary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('JOIN TEAM'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],

          // Register CTA
          ElevatedButton(
            onPressed: (e.isOpen && !registering) ? onRegister : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: e.category.accent,
              disabledBackgroundColor: OrinColors.dim,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: registering
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(
                    e.isOpen
                        ? (e.approvalRequired ? 'APPLY FOR REGISTRATION →' : 'REGISTER NOW →')
                        : 'REGISTRATION CLOSED',
                    style: GoogleFonts.syne(fontSize: 12, fontWeight: FontWeight.w800),
                  ),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementsTab extends ConsumerWidget {
  final String eventId;
  const _AnnouncementsTab({required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcementsAsync = ref.watch(eventAnnouncementsProvider(eventId));

    return announcementsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (announcements) {
        if (announcements.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.campaign_outlined, size: 48, color: OrinColors.muted.withValues(alpha: 0.4)),
                const SizedBox(height: 12),
                Text('No announcements yet.', style: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.muted)),
                Text('Important updates will be posted here.', style: GoogleFonts.dmMono(fontSize: 11, color: OrinColors.dim)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: announcements.length,
          itemBuilder: (ctx, i) {
            final post = announcements[i];
            final text = post['text'] as String? ?? '';
            final timestamp = post['createdAt'] as Timestamp?;
            final dateStr = timestamp != null ? timeago.format(timestamp.toDate()) : '';

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: OrinColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: OrinColors.border2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.campaign, color: OrinColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Text('ANNOUNCEMENT', style: GoogleFonts.dmMono(fontSize: 10, fontWeight: FontWeight.w800, color: OrinColors.primary)),
                      const Spacer(),
                      Text(dateStr, style: GoogleFonts.dmMono(fontSize: 9, color: OrinColors.dim)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(text, style: GoogleFonts.inter(fontSize: 13, color: OrinColors.text, height: 1.5)),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _ParticipantsTab extends ConsumerWidget {
  final String eventId;
  const _ParticipantsTab({required this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final registrationsAsync = ref.watch(eventRegistrationsProvider(eventId));

    return registrationsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (registrations) {
        final approvedList = registrations.where((r) => r['status'] == 'approved').toList();

        if (approvedList.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.people_outline, size: 48, color: OrinColors.muted.withValues(alpha: 0.4)),
                const SizedBox(height: 12),
                Text('No participants registered yet.', style: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.muted)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: approvedList.length,
          itemBuilder: (ctx, i) {
            final reg = approvedList[i];
            final name = reg['userName'] as String? ?? 'Anonymous';
            final institution = reg['institution'] as String? ?? 'Unknown College';

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: OrinColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: OrinColors.border2),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: OrinColors.secondary.withValues(alpha: 0.1),
                    child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: OrinColors.secondary, fontSize: 12)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.text)),
                        Text(institution, style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: OrinColors.surface2,
          border: Border.all(color: OrinColors.border2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(text, style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.muted)),
      );
}

/// ─── Registration Confirmation Sheet ─────────────────────────────────────
class _RegistrationConfirmSheet extends StatelessWidget {
  final String eventTitle;
  final DateTime startDate;
  final bool approvalRequired;

  const _RegistrationConfirmSheet({
    required this.eventTitle,
    required this.startDate,
    required this.approvalRequired,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = approvalRequired ? OrinColors.accent2 : OrinColors.accentTeal;
    final statusLabel = approvalRequired ? 'PENDING APPROVAL' : 'CONFIRMED';
    final statusIcon = approvalRequired ? Icons.hourglass_top_rounded : Icons.check_circle_outline_rounded;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: OrinColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: statusColor.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: statusColor.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: OrinColors.border2,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          // Status icon
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: statusColor.withValues(alpha: 0.1),
              border: Border.all(color: statusColor.withValues(alpha: 0.3), width: 1.5),
            ),
            child: Icon(statusIcon, color: statusColor, size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            approvalRequired ? 'Application Submitted!' : 'Registration Confirmed!',
            style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: OrinColors.text),
          ),
          const SizedBox(height: 8),
          Text(
            approvalRequired
                ? 'Your application is awaiting organizer review.'
                : 'You are all set! Check My Registrations for details.',
            textAlign: TextAlign.center,
            style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.muted, height: 1.6),
          ),
          const SizedBox(height: 28),
          // Event info card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: OrinColors.surface2,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: OrinColors.border2),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_outlined, color: OrinColors.muted, size: 16),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        eventTitle,
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: OrinColors.text),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, color: OrinColors.muted, size: 14),
                    const SizedBox(width: 10),
                    Text(
                      '${startDate.day}/${startDate.month}/${startDate.year}',
                      style: GoogleFonts.dmMono(fontSize: 12, color: OrinColors.muted),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        statusLabel,
                        style: GoogleFonts.dmMono(fontSize: 9, fontWeight: FontWeight.w800, color: statusColor),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: statusColor),
              child: Text('DONE', style: GoogleFonts.syne(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}