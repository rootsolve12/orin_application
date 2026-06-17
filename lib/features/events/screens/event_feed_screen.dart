import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../models/event_category_meta.dart';
import '../models/event_model.dart';
import '../providers/events_provider.dart';
import '../widgets/event_card.dart';

class EventFeedScreen extends ConsumerStatefulWidget {
  const EventFeedScreen({super.key});
  @override
  ConsumerState<EventFeedScreen> createState() => _EventFeedScreenState();
}

class _EventFeedScreenState extends ConsumerState<EventFeedScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(eventFeedProvider);
    final category = ref.watch(selectedCategoryProvider);
    final query = ref.watch(searchQueryProvider);
    final scope = ref.watch(scopeFilterProvider);
    final sort = ref.watch(sortOptionProvider);

    final userDoc = ref.watch(userDocProvider).valueOrNull;
    final userData = userDoc?.data() as Map<String, dynamic>?;
    final userInstitution = userData?['institution'] as String? ?? '';

    return Scaffold(
      body: OrinGridBg(
        child: SafeArea(
          child: Column(
            children: [
              _TopBar(),
              _SearchBar(ctrl: _searchCtrl),
              _FilterAndSortRow(scope: scope, sort: sort),
              const SizedBox(height: 8),
              _CategoryTabs(selected: category),
              Expanded(
                child: eventsAsync.when(
                  loading: () => _ShimmerList(),
                  error: (e, _) => Center(
                      child: Text('Something went wrong: $e',
                          style: GoogleFonts.inter(color: Theme.of(context).hintColor))),
                  data: (list) {
                    // 1. Search Query filtering
                    var filtered = query.isEmpty
                        ? list
                        : list
                            .where((e) =>
                                e.title.toLowerCase().contains(query.toLowerCase()) ||
                                e.description.toLowerCase().contains(query.toLowerCase()) ||
                                e.institution.toLowerCase().contains(query.toLowerCase()) ||
                                e.tags.any((t) => t.toLowerCase().contains(query.toLowerCase())))
                            .toList();

                    // 2. Scope filtering
                    final loc = ref.watch(userLocationProvider);
                    if (scope == 'college' && userInstitution.isNotEmpty) {
                      filtered = filtered
                          .where((e) => e.institution.toLowerCase().trim() == userInstitution.toLowerCase().trim())
                          .toList();
                    } else if (scope == 'nearby') {
                      // Filter out events with no location
                      filtered = filtered.where((e) => e.latitude != null && e.longitude != null).toList();
                    }

                    // 3. Sorting
                    if (scope == 'nearby' && loc != null) {
                      filtered.sort((a, b) {
                        final d1 = Geolocator.distanceBetween(loc.lat, loc.lng, a.latitude!, a.longitude!);
                        final d2 = Geolocator.distanceBetween(loc.lat, loc.lng, b.latitude!, b.longitude!);
                        return d1.compareTo(d2);
                      });
                    } else if (sort == 'latest') {
                      filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
                    } else if (sort == 'popular') {
                      filtered.sort((a, b) => b.registeredCount.compareTo(a.registeredCount));
                    } else if (sort == 'deadline') {
                      filtered.sort((a, b) => a.registrationDeadline.compareTo(b.registrationDeadline));
                    }

                    if (filtered.isEmpty) return _EmptyState();

                    return AnimationLimiter(
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (ctx, i) => AnimationConfiguration.staggeredList(
                          position: i,
                          duration: const Duration(milliseconds: 400),
                          child: SlideAnimation(
                            verticalOffset: 20,
                            child: FadeInAnimation(
                              child: EventCard(event: filtered[i]),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create-event'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TopBar extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final unreadCountAsync = user == null
        ? const AsyncValue<int>.data(0)
        : ref.watch(unreadNotificationsCountProvider(user.uid));
    final unreadCount = unreadCountAsync.valueOrNull ?? 0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Row(
        children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Explore Events',
                style: GoogleFonts.inter(
                    fontSize: 24, fontWeight: FontWeight.w800, color: Theme.of(context).colorScheme.onSurface)),
            Text('Find the best campus events',
                style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).hintColor, fontWeight: FontWeight.w500)),
          ]),
          const Spacer(),
          GestureDetector(
            onTap: () => context.push('/notifications'),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.1)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Icon(Icons.notifications_none_rounded, size: 22),
                  if (unreadCount > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: OrinColors.primary,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 8,
                          minHeight: 8,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchBar extends ConsumerWidget {
  final TextEditingController ctrl;
  const _SearchBar({required this.ctrl});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        controller: ctrl,
        onChanged: (v) => ref.read(searchQueryProvider.notifier).state = v,
        decoration: InputDecoration(
          hintText: 'Search hackathons, workshops...',
          prefixIcon: const Icon(Icons.search_rounded, size: 20),
          suffixIcon: ctrl.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.close_rounded, size: 18),
                  onPressed: () {
                    ctrl.clear();
                    ref.read(searchQueryProvider.notifier).state = '';
                  },
                )
              : null,
        ),
      ),
    );
  }
}

class _FilterAndSortRow extends ConsumerWidget {
  final String scope;
  final String sort;

  const _FilterAndSortRow({required this.scope, required this.sort});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Scope Toggle
          Row(
            children: [
              ChoiceChip(
                label: Text('ALL COLLEGES', style: GoogleFonts.dmMono(fontSize: 9, fontWeight: FontWeight.w700)),
                selected: scope == 'all',
                onSelected: (val) {
                  if (val) ref.read(scopeFilterProvider.notifier).state = 'all';
                },
                selectedColor: OrinColors.primary.withValues(alpha: 0.15),
                checkmarkColor: OrinColors.primary,
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: Text('MY COLLEGE', style: GoogleFonts.dmMono(fontSize: 9, fontWeight: FontWeight.w700)),
                selected: scope == 'college',
                onSelected: (val) {
                  if (val) ref.read(scopeFilterProvider.notifier).state = 'college';
                },
                selectedColor: OrinColors.primary.withValues(alpha: 0.15),
                checkmarkColor: OrinColors.primary,
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: Text('NEARBY', style: GoogleFonts.dmMono(fontSize: 9, fontWeight: FontWeight.w700)),
                selected: scope == 'nearby',
                onSelected: (val) async {
                  if (val) {
                    ref.read(scopeFilterProvider.notifier).state = 'nearby';
                    if (ref.read(userLocationProvider) == null) {
                      try {
                        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
                        if (!serviceEnabled) throw Exception('Location services are disabled.');
                        LocationPermission permission = await Geolocator.checkPermission();
                        if (permission == LocationPermission.denied) {
                          permission = await Geolocator.requestPermission();
                          if (permission == LocationPermission.denied) throw Exception('Permissions denied');
                        }
                        if (permission == LocationPermission.deniedForever) throw Exception('Permissions permanently denied');
                        final pos = await Geolocator.getCurrentPosition();
                        ref.read(userLocationProvider.notifier).state = (lat: pos.latitude, lng: pos.longitude);
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent));
                          ref.read(scopeFilterProvider.notifier).state = 'all'; // fallback
                        }
                      }
                    }
                  }
                },
                selectedColor: OrinColors.primary.withValues(alpha: 0.15),
                checkmarkColor: OrinColors.primary,
              ),
            ],
          ),
          
          // Sort Dropdown
          DropdownButton<String>(
            value: sort,
            dropdownColor: OrinColors.surface,
            underline: const SizedBox(),
            icon: const Icon(Icons.sort_rounded, size: 18, color: OrinColors.muted),
            style: GoogleFonts.dmMono(fontSize: 10, fontWeight: FontWeight.w700, color: OrinColors.text),
            onChanged: (val) {
              if (val != null) ref.read(sortOptionProvider.notifier).state = val;
            },
            items: const [
              DropdownMenuItem(value: 'latest', child: Text('LATEST')),
              DropdownMenuItem(value: 'popular', child: Text('POPULAR')),
              DropdownMenuItem(value: 'deadline', child: Text('DEADLINE')),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoryTabs extends ConsumerWidget {
  final EventCategory? selected;
  const _CategoryTabs({this.selected});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = [null, ...EventCategory.values];
    return SizedBox(
      height: 48,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        scrollDirection: Axis.horizontal,
        itemCount: cats.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final cat = cats[i];
          final isOn = cat == selected;
          final label = cat == null ? 'All Events' : cat.label;
          final color = cat == null ? OrinColors.primary : cat.accent;

          return GestureDetector(
            onTap: () => ref.read(selectedCategoryProvider.notifier).state = cat,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isOn ? color : Theme.of(context).colorScheme.surface,
                border: Border.all(color: isOn ? color : Theme.of(context).dividerColor.withValues(alpha: 0.1)),
                borderRadius: BorderRadius.circular(24),
                boxShadow: isOn
                    ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))]
                    : null,
              ),
              child: Center(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isOn ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                    fontWeight: isOn ? FontWeight.w700 : FontWeight.w600,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ShimmerList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Theme.of(context).dividerColor.withValues(alpha: 0.05),
      highlightColor: Theme.of(context).dividerColor.withValues(alpha: 0.1),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Container(
          height: 240,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.search_off_rounded, size: 64, color: Theme.of(context).dividerColor.withValues(alpha: 0.2)),
        const SizedBox(height: 16),
        Text('No events found',
            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Theme.of(context).hintColor)),
        const SizedBox(height: 8),
        Text('Try adjusting your filters or search terms',
            style: GoogleFonts.inter(fontSize: 14, color: Theme.of(context).hintColor.withValues(alpha: 0.7))),
      ]),
    );
  }
}
