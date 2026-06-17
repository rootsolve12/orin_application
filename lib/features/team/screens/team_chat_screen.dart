import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/team_provider.dart';

class TeamChatScreen extends ConsumerStatefulWidget {
  final String teamId;
  const TeamChatScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamChatScreen> createState() => _TeamChatScreenState();
}

class _TeamChatScreenState extends ConsumerState<TeamChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _send(String userName) async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;

    _msgCtrl.clear();
    setState(() => _sending = true);

    try {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('Not signed in');

      await ref.read(teamServiceProvider).sendChatMessage(
            teamId: widget.teamId,
            senderId: user.uid,
            senderName: userName,
            text: text,
          );
      
      _scrollCtrl.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) return const Scaffold(body: Center(child: Text('Please log in')));

    final userDoc = ref.watch(userDocProvider).valueOrNull;
    final userData = userDoc?.data() as Map<String, dynamic>?;
    final userName = userData != null
        ? '${userData['firstName']} ${userData['lastName']}'
        : 'Unknown';

    final teamAsync = ref.watch(singleTeamProvider(widget.teamId));
    final chatAsync = ref.watch(teamChatStreamProvider(widget.teamId));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: teamAsync.when(
          loading: () => Text('SQUAD CHAT', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
          error: (_, __) => Text('SQUAD CHAT', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
          data: (team) => Text(
            (team?.name ?? 'SQUAD CHAT').toUpperCase(),
            style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1),
          ),
        ),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: Column(
          children: [
            Expanded(
              child: chatAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
                error: (e, _) => Center(child: Text('Error loading chat: $e', style: GoogleFonts.dmMono(color: Colors.redAccent))),
                data: (messages) {
                  if (messages.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.forum_outlined, size: 48, color: OrinColors.muted.withValues(alpha: 0.5)),
                          const SizedBox(height: 12),
                          Text('No messages yet.', style: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.muted)),
                          Text('Say hello to your squad!', style: GoogleFonts.dmMono(fontSize: 11, color: OrinColors.dim)),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    controller: _scrollCtrl,
                    reverse: true,
                    padding: const EdgeInsets.all(20),
                    itemCount: messages.length,
                    itemBuilder: (ctx, i) {
                      final msg = messages[i];
                      final isMe = msg.senderId == user.uid;

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isMe ? OrinColors.primary.withValues(alpha: 0.15) : OrinColors.surface,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(12),
                              topRight: const Radius.circular(12),
                              bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                              bottomRight: isMe ? Radius.zero : const Radius.circular(12),
                            ),
                            border: Border.all(
                              color: isMe
                                  ? OrinColors.primary.withValues(alpha: 0.4)
                                  : OrinColors.border2,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isMe)
                                Text(
                                  msg.senderName,
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: OrinColors.secondary,
                                  ),
                                ),
                              const SizedBox(height: 2),
                              Text(
                                msg.text,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: OrinColors.text,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Align(
                                alignment: Alignment.bottomRight,
                                child: Text(
                                  timeago.format(msg.createdAt, locale: 'en_short'),
                                  style: GoogleFonts.dmMono(
                                    fontSize: 8,
                                    color: OrinColors.dim,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              color: OrinColors.surface,
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _msgCtrl,
                      textInputAction: TextInputAction.send,
                      onFieldSubmitted: (_) => _send(userName),
                      decoration: InputDecoration(
                        hintText: 'Type message...',
                        hintStyle: GoogleFonts.dmMono(fontSize: 13, color: OrinColors.dim),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Material(
                    color: OrinColors.primary,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: _sending ? null : () => _send(userName),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
