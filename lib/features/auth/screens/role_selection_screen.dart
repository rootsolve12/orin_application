import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../providers/auth_provider.dart';

enum UserRole { participant, organizer }

class RoleSelectionScreen extends ConsumerStatefulWidget {
  const RoleSelectionScreen({super.key});
  @override
  ConsumerState<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends ConsumerState<RoleSelectionScreen> {
  UserRole? _selected;
  bool _loading = false;

  Future<void> _confirm() async {
    if (_selected == null) return;
    setState(() => _loading = true);
    try {
      final uid = ref.read(authServiceProvider).currentUser!.uid;
      await ref.read(firestoreProvider).collection('users').doc(uid).update({
        'role': _selected!.name,
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating role: $e')),
        );
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: OrinGridBg(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: OrinTag('Account Setup')),
                const SizedBox(height: 24),
                Text(
                  'Choose Your Path',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Select how you want to use the platform',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 14, color: theme.hintColor),
                ),
                const SizedBox(height: 48),

                _RoleCard(
                  icon: Icons.school_rounded,
                  title: 'Participant',
                  description: 'Discover events, join teams, and build your achievement profile.',
                  selected: _selected == UserRole.participant,
                  color: OrinColors.primary,
                  onTap: () => setState(() => _selected = UserRole.participant),
                ),
                const SizedBox(height: 16),
                _RoleCard(
                  icon: Icons.auto_awesome_rounded,
                  title: 'Organizer',
                  description: 'Create events, manage registrations, and track analytics.',
                  selected: _selected == UserRole.organizer,
                  color: OrinColors.secondary,
                  onTap: () => setState(() => _selected = UserRole.organizer),
                ),

                const Spacer(),
                ElevatedButton(
                  onPressed: (_selected == null || _loading) ? null : _confirm,
                  child: _loading
                      ? const SizedBox(width: 24, height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Confirm Selection'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title, description;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon, required this.title, required this.description,
    required this.selected, required this.color, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.05) : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? color : theme.dividerColor.withValues(alpha: 0.1),
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: selected ? color : color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: selected ? Colors.white : color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: theme.hintColor,
                    ),
                  ),
                ],
              ),
            ),
            if (selected)
              Icon(Icons.check_circle, color: color, size: 24)
            else
              Icon(Icons.radio_button_unchecked, color: theme.dividerColor.withValues(alpha: 0.3), size: 24),
          ],
        ),
      ),
    );
  }
}
