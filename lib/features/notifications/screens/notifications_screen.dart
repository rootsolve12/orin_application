import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_empty_state.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/notifications_provider.dart';
import '../models/notification_model.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) {
      return const Scaffold(
        backgroundColor: OrinColors.bgLight,
        body: Center(child: Text('Please log in.')),
      );
    }

    final notificationsAsync = ref.watch(userNotificationsProvider(user.uid));

    return Scaffold(
      backgroundColor: OrinColors.bgLight,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Area
            Padding(
              padding: const EdgeInsets.fromLTRB(40, 40, 40, 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notifications', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: OrinColors.textLight)),
                      const SizedBox(height: 4),
                      Text('Stay updated with your latest alerts', style: GoogleFonts.inter(fontSize: 15, color: OrinColors.mutedLight)),
                    ],
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: OrinColors.mutedLight,
                      side: const BorderSide(color: OrinColors.borderLight),
                    ),
                    icon: const Icon(Icons.clear_all_rounded, size: 18),
                    label: const Text('Clear All'),
                    onPressed: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: Colors.white,
                          title: Text('Clear Alerts', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          content: Text('Do you want to clear all alerts?', style: GoogleFonts.inter(fontSize: 14, color: OrinColors.mutedLight)),
                          actions: [
                            TextButton(
                              child: Text('Cancel', style: GoogleFonts.inter(color: OrinColors.mutedLight)),
                              onPressed: () => Navigator.pop(ctx, false),
                            ),
                            TextButton(
                              child: Text('Clear All', style: GoogleFonts.inter(color: OrinColors.primary, fontWeight: FontWeight.w700)),
                              onPressed: () => Navigator.pop(ctx, true),
                            ),
                          ],
                        ),
                      );
                      if (confirmed == true) {
                        await ref.read(notificationsServiceProvider).clearAll(user.uid);
                      }
                    },
                  ),
                ],
              ),
            ),
            
            // Notifications List
            Expanded(
              child: notificationsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
                error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.inter(color: Colors.redAccent))),
                data: (notifications) {
                  if (notifications.isEmpty) {
                    return const OrinEmptyState(
                      icon: Icons.notifications_off_outlined,
                      title: 'All Clear',
                      subtitle: 'No notifications at the moment.',
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
                    itemCount: notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (ctx, i) {
                      final notif = notifications[i];
                      return _NotificationCard(notification: notif, userId: user.uid);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  final NotificationModel notification;
  final String userId;

  const _NotificationCard({required this.notification, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final iconData = switch (notification.type) {
      'announcement' => Icons.campaign_outlined,
      'registration_approved' => Icons.check_circle_outline_rounded,
      'registration_rejected' => Icons.cancel_outlined,
      'team_invite' => Icons.group_add_outlined,
      _ => Icons.notifications_none_rounded,
    };

    final iconColor = switch (notification.type) {
      'announcement' => OrinColors.primary,
      'registration_approved' => Colors.green,
      'registration_rejected' => Colors.redAccent,
      'team_invite' => const Color(0xFFB24BF3),
      _ => OrinColors.mutedLight,
    };

    return InkWell(
      onTap: () async {
        if (!notification.read) {
          await ref.read(notificationsServiceProvider).markAsRead(userId, notification.id);
        }
        if (notification.eventId != null && context.mounted) {
          context.push('/event/${notification.eventId}');
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: notification.read ? Colors.white : OrinColors.primary.withValues(alpha: 0.05),
          border: Border.all(
            color: notification.read
                ? OrinColors.borderLight
                : OrinColors.primary.withValues(alpha: 0.2),
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(iconData, color: iconColor, size: 24),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: notification.read ? FontWeight.w600 : FontWeight.w700,
                            color: OrinColors.textLight,
                          ),
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (!notification.read)
                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: OrinColors.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20, color: OrinColors.mutedLight),
                            onPressed: () async {
                              await ref.read(notificationsServiceProvider).deleteNotification(userId, notification.id);
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notification.body,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: notification.read ? OrinColors.mutedLight : OrinColors.textLight.withValues(alpha: 0.8),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    timeago.format(notification.createdAt),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: OrinColors.mutedLight,
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
