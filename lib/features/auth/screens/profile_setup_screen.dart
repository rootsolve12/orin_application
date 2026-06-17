import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_tag.dart';
import '../providers/auth_provider.dart';

const _allInterests = [
  'Hackathons', 'AI/ML', 'Web Dev', 'Cultural', 'Sports',
  'Design', 'Robotics', 'Finance', 'Music', 'Gaming',
  'Research', 'Entrepreneurship',
];

const _years = ['1st', '2nd', '3rd', '4th', 'PG'];

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});
  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _deptCtrl   = TextEditingController();
  final _rollCtrl   = TextEditingController();
  final _linkedinCtrl = TextEditingController();
  String _year      = '2nd';
  final Set<String> _interests = {};
  bool _loading     = false;

  Future<void> _finish() async {
    if (_deptCtrl.text.isEmpty || _rollCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final uid = ref.read(authServiceProvider).currentUser!.uid;
      await ref.read(firestoreProvider).collection('users').doc(uid).update({
        'department':      _deptCtrl.text.trim(),
        'year':            _year,
        'rollNumber':      _rollCtrl.text.trim(),
        'interests':       _interests.toList(),
        'linkedin':        _linkedinCtrl.text.trim(),
        'profileComplete': true,
        'updatedAt':       FieldValue.serverTimestamp(),
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving profile: $e')),
        );
        setState(() => _loading = false);
      }
    }
  }

  @override
  void dispose() {
    _deptCtrl.dispose(); _rollCtrl.dispose(); _linkedinCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: OrinGridBg(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(children: List.generate(3, (i) => Expanded(child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                  decoration: BoxDecoration(
                    color: OrinColors.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                )))),
                const SizedBox(height: 24),
                const Center(child: OrinTag('Final Step')),
                const SizedBox(height: 24),
                Text('Complete Your Profile',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 28, fontWeight: FontWeight.w800,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 32),

                Center(
                  child: Stack(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          shape: BoxShape.circle,
                          border: Border.all(color: theme.dividerColor.withValues(alpha: 0.1), width: 2),
                        ),
                        child: Icon(Icons.person_outline_rounded, color: theme.hintColor, size: 48),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: OrinColors.primary, shape: BoxShape.circle),
                          child: const Icon(Icons.add_a_photo_rounded, color: Colors.white, size: 16),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                Row(children: [
                  Expanded(child: TextFormField(
                    controller: _deptCtrl,
                    decoration: const InputDecoration(labelText: 'Department'),
                  )),
                  const SizedBox(width: 16),
                  SizedBox(width: 120, child: DropdownButtonFormField<String>(
                    value: _year,
                    decoration: const InputDecoration(labelText: 'Year'),
                    items: _years.map((y) => DropdownMenuItem(
                        value: y, child: Text(y))).toList(),
                    onChanged: (v) => setState(() => _year = v!),
                  )),
                ]),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _rollCtrl,
                  decoration: const InputDecoration(labelText: 'Roll Number'),
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _linkedinCtrl,
                  decoration: const InputDecoration(
                      labelText: 'LinkedIn / GitHub (optional)',
                      prefixIcon: Icon(Icons.link_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 32),

                Text('INTERESTS',
                    style: GoogleFonts.inter(
                        fontSize: 11, fontWeight: FontWeight.w700, color: theme.hintColor, letterSpacing: 0.5)),
                const SizedBox(height: 12),
                Wrap(spacing: 10, runSpacing: 10,
                  children: _allInterests.map((tag) {
                    final on = _interests.contains(tag);
                    return GestureDetector(
                      onTap: () => setState(() =>
                      on ? _interests.remove(tag) : _interests.add(tag)),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: on ? OrinColors.primary : theme.colorScheme.surface,
                          border: Border.all(
                            color: on ? OrinColors.primary : theme.dividerColor.withValues(alpha: 0.1),
                          ),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(tag,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: on ? FontWeight.w700 : FontWeight.w600,
                            color: on ? Colors.white : theme.colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 48),
                ElevatedButton(
                  onPressed: _loading ? null : _finish,
                  child: _loading
                      ? const SizedBox(width: 24, height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Complete Setup'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
