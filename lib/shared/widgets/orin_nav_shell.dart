import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';

class OrinNavShell extends ConsumerWidget {
  final Widget child;
  const OrinNavShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userDoc = ref.watch(userDocProvider).valueOrNull;
    final data = userDoc?.data() as Map<String, dynamic>?;
    final isOrganizer = data?['role'] == 'organizer';
    final location = GoRouterState.of(context).matchedLocation;

    return Scaffold(
      backgroundColor: OrinColors.bgLight,
      body: Row(
        children: [
          // Left Sidebar
          Container(
            width: 260,
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                right: BorderSide(color: OrinColors.borderLight, width: 1),
              ),
            ),
            child: Column(
              children: [
                // Logo Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: OrinColors.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        'Orin',
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: OrinColors.textLight,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Navigation Items
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _SidebarItem(
                        icon: Icons.explore_outlined,
                        activeIcon: Icons.explore,
                        label: 'Explore',
                        active: location == '/feed',
                        onTap: () => context.go('/feed'),
                      ),
                      _SidebarItem(
                        icon: Icons.groups_outlined,
                        activeIcon: Icons.groups,
                        label: 'Communities',
                        active: location == '/teams' || location.startsWith('/team/'),
                        onTap: () => context.go('/teams'),
                      ),
                      _SidebarItem(
                        icon: Icons.calendar_today_outlined,
                        activeIcon: Icons.calendar_month,
                        label: 'My Events',
                        active: location == '/my-registrations',
                        onTap: () => context.go('/my-registrations'),
                      ),
                      if (isOrganizer)
                        _SidebarItem(
                          icon: Icons.dashboard_customize_outlined,
                          activeIcon: Icons.dashboard_customize,
                          label: 'Organizer Tools',
                          active: location == '/organizer',
                          onTap: () => context.go('/organizer'),
                        ),
                      _SidebarItem(
                        icon: Icons.person_outline_rounded,
                        activeIcon: Icons.person_rounded,
                        label: 'Profile',
                        active: location == '/profile',
                        onTap: () => context.go('/profile'),
                      ),
                    ],
                  ),
                ),
                // Bottom legal links
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      GestureDetector(
                        onTap: () => context.push('/privacy-policy'),
                        child: Text('Privacy Policy', style: GoogleFonts.inter(fontSize: 11, color: OrinColors.mutedLight, decoration: TextDecoration.underline)),
                      ),
                      const SizedBox(width: 16),
                      GestureDetector(
                        onTap: () => context.push('/terms-of-service'),
                        child: Text('Terms of Service', style: GoogleFonts.inter(fontSize: 11, color: OrinColors.mutedLight, decoration: TextDecoration.underline)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Main Content Area
          Expanded(
            child: child,
          ),
        ],
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon, activeIcon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _SidebarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = active ? Colors.white : OrinColors.mutedLight;
    final bgColor = active ? OrinColors.primary : Colors.transparent;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(active ? activeIcon : icon, color: color, size: 22),
              const SizedBox(width: 16),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
