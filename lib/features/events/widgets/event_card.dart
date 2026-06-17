import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/bookmarks_provider.dart';
import '../models/event_model.dart';
import '../models/event_category_meta.dart';

class EventCard extends ConsumerWidget {
  final EventModel event;
  const EventCard({super.key, required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deadline = event.registrationDeadline;
    final deadlineText = deadline.isBefore(DateTime.now())
        ? 'Closed'
        : timeago.format(deadline, allowFromNow: true);

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.05)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner
            _EventBanner(event: event),
            // Body
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 14, color: Theme.of(context).hintColor),
                      const SizedBox(width: 4),
                      Text(
                        event.mode.label,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Theme.of(context).hintColor,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(Icons.access_time, size: 14, color: Theme.of(context).hintColor),
                      const SizedBox(width: 4),
                      Text(
                        deadlineText,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Theme.of(context).hintColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Fill indicator
                  LinearPercentIndicator(
                    padding: EdgeInsets.zero,
                    lineHeight: 6,
                    percent: event.fillPercent,
                    backgroundColor: Theme.of(context).dividerColor.withValues(alpha: 0.1),
                    progressColor: OrinColors.primary,
                    barRadius: const Radius.circular(3),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${(event.fillPercent * 100).toInt()}% filled',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: OrinColors.primary,
                        ),
                      ),
                      Text(
                        '${event.registeredCount}/${event.capacity} registered',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Theme.of(context).hintColor,
                        ),
                      ),
                    ],
                  ),
                  if (event.timeline != null && event.timeline!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: OrinColors.primary.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: OrinColors.primary.withValues(alpha: 0.1)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Timeline',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: OrinColors.primary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ...event.timeline!.map((step) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: (step['completed'] as bool? ?? false) ? OrinColors.primary : OrinColors.mutedLight,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    step['title']?.toString() ?? '',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: (step['completed'] as bool? ?? false) ? FontWeight.w600 : FontWeight.w400,
                                      color: Theme.of(context).colorScheme.onSurface,
                                    ),
                                  ),
                                ),
                                Text(
                                  step['date']?.toString() ?? '',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: Theme.of(context).hintColor,
                                  ),
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventBanner extends ConsumerWidget {
  final EventModel event;
  const _EventBanner({required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final isBookmarked = user == null
        ? false
        : ref.watch(isBookmarkedProvider((userId: user.uid, eventId: event.id))).valueOrNull ?? false;

    return Container(
      height: 120,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        color: event.category.accent.withValues(alpha: 0.1),
        image: event.bannerUrl != null
            ? DecorationImage(
                image: NetworkImage(event.bannerUrl!),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: Stack(
        children: [
          if (event.bannerUrl != null)
            Container(
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.1),
                    Colors.black.withValues(alpha: 0.4),
                  ],
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Category tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    event.category.shortLabel.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: event.category.accent,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                // Institution
                Text(
                  event.institution,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    shadows: [
                      const Shadow(blurRadius: 4, color: Colors.black26),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (user != null)
            Positioned(
              top: 8,
              right: 8,
              child: Material(
                color: Colors.black.withValues(alpha: 0.5),
                shape: const CircleBorder(),
                child: IconButton(
                  constraints: const BoxConstraints(),
                  padding: const EdgeInsets.all(8),
                  icon: Icon(
                    isBookmarked ? Icons.bookmark : Icons.bookmark_border_outlined,
                    color: isBookmarked ? OrinColors.primary : Colors.white,
                    size: 18,
                  ),
                  onPressed: () {
                    ref.read(bookmarkServiceProvider).toggleBookmark(user.uid, event.id);
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}
