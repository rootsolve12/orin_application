import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../../auth/providers/auth_provider.dart';
import '../../events/providers/events_provider.dart';
import '../providers/team_provider.dart';

class CreateTeamScreen extends ConsumerStatefulWidget {
  final String eventId;
  const CreateTeamScreen({super.key, required this.eventId});

  @override
  ConsumerState<CreateTeamScreen> createState() => _CreateTeamScreenState();
}

class _CreateTeamScreenState extends ConsumerState<CreateTeamScreen> {
  final _nameCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  int _maxSize = 4;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit(String leaderName, int eventMaxTeamSize) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('Not authenticated');

      final finalMaxSize = _maxSize.clamp(2, eventMaxTeamSize);

      final teamId = await ref.read(teamServiceProvider).createTeam(
            name: _nameCtrl.text.trim(),
            eventId: widget.eventId,
            leaderId: user.uid,
            leaderName: leaderName,
            maxSize: finalMaxSize,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Team created successfully!'),
            backgroundColor: OrinColors.secondary,
          ),
        );
        context.pop();
        context.push('/team/$teamId');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDoc = ref.watch(userDocProvider).valueOrNull;
    final userData = userDoc?.data() as Map<String, dynamic>?;
    final userName = userData != null
        ? '${userData['firstName']} ${userData['lastName']}'
        : 'Unknown';

    final eventAsync = ref.watch(singleEventProvider(widget.eventId));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('CREATE TEAM', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: eventAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error loading event data: $e')),
          data: (event) {
            if (event == null) {
              return const Center(child: Text('Event not found'));
            }

            final eventMaxTeamSize = event.maxTeamSize ?? 4;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: OrinTag('Assemble Squad')),
                    const SizedBox(height: 24),
                    Text(
                      'Form a team for',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(fontSize: 14, color: OrinColors.muted),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.title,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.syne(fontSize: 20, fontWeight: FontWeight.w800, color: OrinColors.text),
                    ),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Team Name',
                        prefixIcon: Icon(Icons.group_work_outlined, size: 20),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter team name' : null,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'MAX MEMBERS: $_maxSize',
                      style: GoogleFonts.dmMono(fontSize: 12, fontWeight: FontWeight.w700, color: OrinColors.text),
                    ),
                    Slider(
                      value: _maxSize.toDouble(),
                      min: 2,
                      max: eventMaxTeamSize.toDouble(),
                      divisions: eventMaxTeamSize - 1,
                      label: _maxSize.toString(),
                      activeColor: OrinColors.primary,
                      inactiveColor: OrinColors.border,
                      onChanged: (val) {
                        setState(() {
                          _maxSize = val.toInt();
                        });
                      },
                    ),
                    const SizedBox(height: 48),
                    ElevatedButton(
                      onPressed: _loading ? null : () => _submit(userName, eventMaxTeamSize),
                      child: _loading
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('CREATE TEAM'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
