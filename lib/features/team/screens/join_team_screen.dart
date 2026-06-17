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
import '../models/team_model.dart';

class JoinTeamScreen extends ConsumerStatefulWidget {
  final String eventId;
  const JoinTeamScreen({super.key, required this.eventId});

  @override
  ConsumerState<JoinTeamScreen> createState() => _JoinTeamScreenState();
}

class _JoinTeamScreenState extends ConsumerState<JoinTeamScreen> {
  bool _joining = false;

  Future<void> _join(TeamModel team, String userName) async {
    setState(() => _joining = true);
    try {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('Not authenticated');

      await ref.read(teamServiceProvider).joinTeam(
            teamId: team.id,
            userId: user.uid,
            userName: userName,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Joined ${team.name} successfully!'),
            backgroundColor: OrinColors.secondary,
          ),
        );
        context.pop();
        context.push('/team/${team.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDoc = ref.watch(userDocProvider).valueOrNull;
    final userData = userDoc?.data() as Map<String, dynamic>?;
    final userName = userData != null
        ? '${userData['firstName']} ${userData['lastName']}'
        : 'Unknown';

    final teamsAsync = ref.watch(eventTeamsStreamProvider(widget.eventId));
    final eventAsync = ref.watch(singleEventProvider(widget.eventId));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('JOIN TEAM', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: eventAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error loading event: $e')),
          data: (event) {
            if (event == null) {
              return const Center(child: Text('Event not found'));
            }

            return teamsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
              error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.dmMono(color: Colors.redAccent))),
              data: (teams) {
                if (teams.isEmpty) {
                  return OrinEmptyState(
                    icon: Icons.group_off_outlined,
                    title: 'No Teams Yet',
                    subtitle: 'Be the first to build a squad for this event!',
                    ctaLabel: 'CREATE TEAM',
                    onCta: () => context.pushReplacement('/create-team/${widget.eventId}'),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: teams.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) {
                    final team = teams[i];
                    final currentCount = team.memberIds.length;
                    final isFull = currentCount >= team.maxSize;
                    final user = ref.read(authServiceProvider).currentUser;
                    final alreadyIn = user != null && team.memberIds.contains(user.uid);

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
                                Text(
                                  'Members: $currentCount / ${team.maxSize}',
                                  style: GoogleFonts.dmMono(fontSize: 11, color: OrinColors.muted),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: (_joining || isFull || alreadyIn)
                                ? null
                                : () => _join(team, userName),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: OrinColors.secondary,
                              disabledBackgroundColor: OrinColors.dim,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                            child: Text(
                              alreadyIn
                                  ? 'JOINED'
                                  : isFull
                                      ? 'FULL'
                                      : 'JOIN',
                              style: GoogleFonts.dmMono(fontSize: 11, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
