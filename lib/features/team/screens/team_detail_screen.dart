import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/team_provider.dart';
import '../models/team_model.dart';

class TeamDetailScreen extends ConsumerStatefulWidget {
  final String teamId;
  const TeamDetailScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamDetailScreen> createState() => _TeamDetailScreenState();
}

class _TeamDetailScreenState extends ConsumerState<TeamDetailScreen> {
  bool _submitting = false;

  Future<void> _leaveTeam(TeamModel team, String userId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OrinColors.surface,
        title: Text('Leave Team', style: GoogleFonts.syne(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to leave this team?', style: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.muted)),
        actions: [
          TextButton(
            child: Text('CANCEL', style: GoogleFonts.dmMono(color: OrinColors.muted)),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            child: Text('LEAVE', style: GoogleFonts.dmMono(color: Colors.redAccent)),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _submitting = true);
      try {
        await ref.read(teamServiceProvider).leaveTeam(team.id, userId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You have left the team.'), backgroundColor: OrinColors.primary),
          );
          context.pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
          );
        }
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
    }
  }

  Future<void> _removeMember(TeamModel team, String leaderId, String memberId, String memberName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OrinColors.surface,
        title: Text('Remove Member', style: GoogleFonts.syne(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to remove $memberName from the team?', style: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.muted)),
        actions: [
          TextButton(
            child: Text('CANCEL', style: GoogleFonts.dmMono(color: OrinColors.muted)),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            child: Text('REMOVE', style: GoogleFonts.dmMono(color: Colors.redAccent)),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _submitting = true);
      try {
        await ref.read(teamServiceProvider).removeMember(team.id, leaderId, memberId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$memberName removed.'), backgroundColor: OrinColors.primary),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
          );
        }
      } finally {
        if (mounted) setState(() => _submitting = false);
      }
    }
  }

  Future<void> _addTaskDialog(TeamModel team) async {
    final ctrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OrinColors.surface,
        title: Text('Add Task', style: GoogleFonts.syne(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'Task description...'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            child: Text('CANCEL', style: GoogleFonts.dmMono(color: OrinColors.muted)),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            child: Text('ADD', style: GoogleFonts.dmMono(color: OrinColors.primary)),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && ctrl.text.trim().isNotEmpty) {
      try {
        await ref.read(teamServiceProvider).addTask(team.id, {
          'title': ctrl.text.trim(),
          'status': 'todo',
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  Future<void> _addLinkDialog(TeamModel team) async {
    final titleCtrl = TextEditingController();
    final urlCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: OrinColors.surface,
        title: Text('Add Quick Link', style: GoogleFonts.syne(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(hintText: 'Title (e.g. GitHub)')),
            const SizedBox(height: 12),
            TextField(controller: urlCtrl, decoration: const InputDecoration(hintText: 'https://...')),
          ],
        ),
        actions: [
          TextButton(
            child: Text('CANCEL', style: GoogleFonts.dmMono(color: OrinColors.muted)),
            onPressed: () => Navigator.pop(ctx, false),
          ),
          TextButton(
            child: Text('ADD', style: GoogleFonts.dmMono(color: OrinColors.primary)),
            onPressed: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirmed == true && titleCtrl.text.trim().isNotEmpty && urlCtrl.text.trim().isNotEmpty) {
      try {
        await ref.read(teamServiceProvider).addLink(team.id, {
          'title': titleCtrl.text.trim(),
          'url': urlCtrl.text.trim(),
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  Future<void> _toggleTaskStatus(TeamModel team, int index) async {
    final tasks = List<Map<String, dynamic>>.from(team.tasks);
    final currentStatus = tasks[index]['status'];
    tasks[index]['status'] = currentStatus == 'todo' ? 'in-progress' : (currentStatus == 'in-progress' ? 'done' : 'todo');
    try {
      await ref.read(teamServiceProvider).updateTaskStatus(team.id, tasks);
    } catch (e) {
      debugPrint('Error toggling task: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) return const Scaffold(body: Center(child: Text('Please log in')));

    final teamAsync = ref.watch(singleTeamProvider(widget.teamId));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('MISSION CONTROL', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      extendBodyBehindAppBar: true,
      body: teamAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (team) {
          if (team == null) return const Center(child: Text('Team not found.'));

          final isLeader = team.leaderId == user.uid;

          return OrinGridBg(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [OrinColors.primary, Color(0xFF00F0FF)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(color: OrinColors.primary.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'WORKSPACE',
                              style: GoogleFonts.dmMono(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1, color: Colors.white.withValues(alpha: 0.8)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              team.name,
                              style: GoogleFonts.syne(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                            if (team.inviteCode != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text('Code: ${team.inviteCode}', style: GoogleFonts.dmMono(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                              ),
                            ],
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: OrinColors.primary,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                icon: const Icon(Icons.video_call_rounded),
                                label: Text('Join Secure Call', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Launching Secure Video Room...')));
                                },
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Kanban Tasks Section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('TEAM BACKLOG', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: OrinColors.muted, letterSpacing: 0.5)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, color: OrinColors.primary, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _addTaskDialog(team),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      if (team.tasks.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text('No tasks assigned yet. Add one to get started!', style: GoogleFonts.inter(fontSize: 13, color: OrinColors.muted)),
                        );
                      }
                      final task = team.tasks[i];
                      final isDone = task['status'] == 'done';
                      final isInProgress = task['status'] == 'in-progress';
                      
                      Color statusColor = OrinColors.border2;
                      IconData statusIcon = Icons.circle_outlined;
                      if (isInProgress) {
                        statusColor = Colors.orangeAccent;
                        statusIcon = Icons.autorenew_rounded;
                      } else if (isDone) {
                        statusColor = Colors.greenAccent;
                        statusIcon = Icons.check_circle_rounded;
                      }

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: InkWell(
                          onTap: () => _toggleTaskStatus(team, i),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: OrinColors.surface,
                              border: Border.all(color: statusColor),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(statusIcon, color: statusColor, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    task['title'],
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: isDone ? OrinColors.muted : OrinColors.text,
                                      decoration: isDone ? TextDecoration.lineThrough : null,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                    childCount: team.tasks.isEmpty ? 1 : team.tasks.length,
                  ),
                ),

                // Quick Links Section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('QUICK LINKS', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: OrinColors.muted, letterSpacing: 0.5)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, color: OrinColors.primary, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _addLinkDialog(team),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      if (team.links.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text('Pin important resources here.', style: GoogleFonts.inter(fontSize: 13, color: OrinColors.muted)),
                        );
                      }
                      final link = team.links[i];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: OrinColors.surface,
                            border: Border.all(color: OrinColors.border2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.link_rounded, color: OrinColors.primary, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  link['title'],
                                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.text),
                                ),
                              ),
                              const Icon(Icons.open_in_new_rounded, color: OrinColors.muted, size: 16),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: team.links.isEmpty ? 1 : team.links.length,
                  ),
                ),

                // Roster Section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Text('ROSTER', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: OrinColors.muted, letterSpacing: 0.5)),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final memberId = team.memberIds[i];
                      final memberName = team.memberNames[memberId] ?? 'Unknown';
                      final isMe = memberId == user.uid;
                      final isMemberLeader = memberId == team.leaderId;

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: OrinColors.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: OrinColors.border2),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: isMemberLeader ? OrinColors.primary.withValues(alpha: 0.2) : OrinColors.border,
                                child: Text(
                                  memberName.isNotEmpty ? memberName[0].toUpperCase() : '?',
                                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: isMemberLeader ? OrinColors.primary : OrinColors.muted),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      memberName + (isMe ? ' (You)' : ''),
                                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: OrinColors.text),
                                    ),
                                    if (isMemberLeader)
                                      Text('Team Leader', style: GoogleFonts.dmMono(fontSize: 10, color: OrinColors.primary, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              ),
                              if (isLeader && !isMe)
                                IconButton(
                                  icon: const Icon(Icons.person_remove_rounded, color: Colors.redAccent, size: 20),
                                  onPressed: _submitting ? null : () => _removeMember(team, user.uid, memberId, memberName),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: team.memberIds.length,
                  ),
                ),

                // Bottom padding
                const SliverToBoxAdapter(child: SizedBox(height: 100)),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: OrinColors.primary,
        icon: const Icon(Icons.forum_rounded, color: Colors.white),
        label: Text('Open Chat', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white)),
        onPressed: () => context.push('/team/${widget.teamId}/chat'),
      ),
    );
  }
}
