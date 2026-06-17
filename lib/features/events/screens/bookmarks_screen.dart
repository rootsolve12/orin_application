import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/orin_grid_bg.dart';
import '../../../shared/widgets/orin_empty_state.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/bookmarks_provider.dart';
import '../widgets/event_card.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    if (user == null) {
      return const Scaffold(
        backgroundColor: OrinColors.bg,
        body: Center(child: Text('Please log in to view bookmarks.')),
      );
    }

    final bookmarksAsync = ref.watch(bookmarkedEventsProvider(user.uid));

    return Scaffold(
      backgroundColor: OrinColors.bg,
      appBar: AppBar(
        title: Text('MY BOOKMARKS', style: GoogleFonts.syne(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
        centerTitle: true,
      ),
      body: OrinGridBg(
        child: bookmarksAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: OrinColors.primary)),
          error: (e, _) => Center(child: Text('Error: $e', style: GoogleFonts.dmMono(color: Colors.redAccent))),
          data: (events) {
            if (events.isEmpty) {
              return const OrinEmptyState(
                icon: Icons.bookmark_border_rounded,
                title: 'No Bookmarks Yet',
                subtitle: 'Your saved events will appear here. Start exploring!',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: events.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (ctx, i) => EventCard(event: events[i]),
            );
          },
        ),
      ),
    );
  }
}
