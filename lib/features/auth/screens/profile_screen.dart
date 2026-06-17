import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../features/events/providers/events_provider.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _launchUrl(BuildContext context, String urlString) async {
    if (urlString.trim().isEmpty) return;
    final uri = Uri.parse(urlString.trim());
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw 'Could not launch $urlString';
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Invalid link or unable to open: $urlString'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userDoc = ref.watch(userDocProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: userDoc.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (doc) {
            final data = doc?.data() as Map<String, dynamic>?;
            if (data == null) return const Center(child: Text('User not found'));

            final firstName = data['firstName'] ?? 'User';
            final lastName = data['lastName'] ?? '';
            final email = data['email'] ?? '';
            final photoUrl = data['photoUrl'] as String?;
            final portfolio = data['portfolio'] as String? ?? '';

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: OrinColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: OrinColors.primary,
                            borderRadius: BorderRadius.circular(16),
                            image: photoUrl != null ? DecorationImage(image: NetworkImage(photoUrl), fit: BoxFit.cover) : null,
                          ),
                          child: photoUrl == null
                              ? Center(
                                  child: Text(
                                    firstName[0].toUpperCase(),
                                    style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$firstName $lastName',
                                style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: theme.textTheme.displayLarge?.color),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                email,
                                style: GoogleFonts.inter(fontSize: 15, color: theme.textTheme.bodyMedium?.color),
                              ),
                              const SizedBox(height: 24),
                              Row(
                                children: [
                                  _ActionChip(
                                    icon: Icons.edit_outlined,
                                    label: 'Edit Profile',
                                    onTap: () => context.push('/edit-profile'),
                                  ),
                                  const SizedBox(width: 12),
                                  if (portfolio.isNotEmpty)
                                    _ActionChip(
                                      icon: Icons.open_in_new_outlined,
                                      label: 'View Portfolio',
                                      onTap: () => _launchUrl(context, portfolio),
                                    ),
                                  const SizedBox(width: 12),
                                  _ActionChip(
                                    icon: Icons.logout_outlined,
                                    label: 'Sign Out',
                                    onTap: () async {
                                      await ref.read(authServiceProvider).signOut();
                                      if (context.mounted) context.go('/login');
                                    },
                                  ),
                                ],
                              ),

                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Stat Cards Row
                  Consumer(
                    builder: (ctx, cref, _) {
                      final user = cref.watch(authStateProvider).valueOrNull;
                      final regsAsync = user == null
                          ? const AsyncValue<List<Map<String, dynamic>>>.data([])
                          : cref.watch(userRegistrationsProvider(user.uid));
                      final regs = regsAsync.valueOrNull ?? [];
                      final total = regs.length;
                      final attended = regs.where((r) {
                        final reg = r['registration'] as Map<String, dynamic>?;
                        return reg?['attendance'] == true;
                      }).length;

                      return Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              icon: Icons.calendar_today,
                              iconColor: const Color(0xFFB24BF3),
                              bgColor: const Color(0xFFB24BF3).withValues(alpha: 0.1),
                              value: '$total',
                              label: 'Events Participated',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _StatCard(
                              icon: Icons.military_tech_outlined,
                              iconColor: const Color(0xFF00E676),
                              bgColor: const Color(0xFF00E676).withValues(alpha: 0.1),
                              value: '0',
                              label: 'Certificates Earned',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _StatCard(
                              icon: Icons.star_border_outlined,
                              iconColor: const Color(0xFFFF9800),
                              bgColor: const Color(0xFFFF9800).withValues(alpha: 0.1),
                              value: '$attended',
                              label: 'Events Completed',
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: _StatCard(
                              icon: Icons.trending_up,
                              iconColor: Color(0xFF2196F3),
                              bgColor: Color(0x1A2196F3),
                              value: '0',
                              label: 'Skills Acquired',
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 32),

                  // Recent Certificates
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Recent Certificates', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: theme.textTheme.bodyLarge?.color)),
                            Text('View all', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: OrinColors.primary)),
                          ],
                        ),
                        const SizedBox(height: 48),
                        Center(
                          child: Text(
                            'No certificates yet. Participate in events to earn them!',
                            style: GoogleFonts.inter(fontSize: 14, color: theme.textTheme.bodyMedium?.color),
                          ),
                        ),
                        const SizedBox(height: 48),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Recent Activity
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.dividerColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Recent Activity', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: theme.textTheme.bodyLarge?.color)),
                        const SizedBox(height: 16),
                        Consumer(
                          builder: (ctx, cref, _) {
                            final user = cref.watch(authStateProvider).valueOrNull;
                            final regsAsync = user == null
                                ? const AsyncValue<List<Map<String, dynamic>>>.data([])
                                : cref.watch(userRegistrationsProvider(user.uid));
                            
                            return regsAsync.when(
                              loading: () => const Center(child: CircularProgressIndicator()),
                              error: (_, __) => const Text('Failed to load activity'),
                              data: (regs) {
                                  if (regs.isEmpty) {
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 24),
                                      child: Text('No recent activity.', style: GoogleFonts.inter(fontSize: 14, color: theme.textTheme.bodyMedium?.color)),
                                    );
                                  }
                                
                                final recent = regs.take(3).toList();
                                return Column(
                                  children: recent.map((r) {
                                    final event = r['event'] as Map<String, dynamic>?;
                                    final title = event?['title'] ?? 'Unknown Event';
                                    final status = r['registration']?['status'] ?? 'pending';
                                    
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            margin: const EdgeInsets.only(top: 6),
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: OrinColors.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: theme.textTheme.bodyLarge?.color)),
                                                const SizedBox(height: 4),
                                                Text('Status: ${status.toString().toUpperCase()} • Stage: Registration', 
                                                  style: GoogleFonts.inter(fontSize: 12, color: theme.textTheme.bodyMedium?.color)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                );
                              },
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Theme.of(context).textTheme.bodyLarge?.color),
            const SizedBox(width: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color)),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 24),
          Text(value, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: Theme.of(context).textTheme.bodyLarge?.color)),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: Theme.of(context).textTheme.bodyMedium?.color)),
        ],
      ),
    );
  }
}
