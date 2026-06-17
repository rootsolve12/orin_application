import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_empty_state.dart';
import '../../auth/providers/auth_provider.dart';
import '../../events/providers/events_provider.dart';
import '../providers/team_provider.dart';

class TeamListScreen extends ConsumerWidget {
  const TeamListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) {
      return const Scaffold(
        backgroundColor: OrinColors.bg,
        body: Center(child: Text('Please log in.')),
      );
    }

    final teamsAsync = ref.watch(userTeamsStreamProvider(user.uid));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('MY SQUADS', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: teamsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.dmMono(color: Colors.redAccent))),
          data: (teams) {
            if (teams.isEmpty) {
              return const OrinEmptyState(
                icon: Icons.groups_outlined,
                title: 'No Squads',
                subtitle: 'You are not in any teams yet.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: teams.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final team = teams[i];
                final eventAsync = ref.watch(singleEventProvider(team.eventId));

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: OrinColors.surface,
                    border: Border.all(color: OrinColors.border2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              team.name,
                              style: GoogleFonts.syne(fontSize: 16, fontWeight: FontWeight.w700, color: OrinColors.text),
                            ),
                            const SizedBox(height: 4),
                            eventAsync.when(
                              loading: () => const SizedBox(),
                              error: (_, __) => const SizedBox(),
                              data: (event) => Text(
                                event?.title ?? 'Unknown Event',
                                style: GoogleFonts.dmMono(fontSize: 11, color: OrinColors.muted),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Members: ${team.memberIds.length} / ${team.maxSize}',
                              style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.dim),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.forum_outlined, color: OrinColors.secondary),
                        onPressed: () => context.push('/team/${team.id}/chat'),
                      ),
                      IconButton(
                        icon: const Icon(Icons.arrow_forward_ios, color: OrinColors.muted, size: 16),
                        onPressed: () => context.push('/team/${team.id}'),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
