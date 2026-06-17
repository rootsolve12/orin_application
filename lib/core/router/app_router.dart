import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/auth/screens/role_selection_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/auth/screens/profile_screen.dart';
import '../../features/events/screens/event_feed_screen.dart';
import '../../features/events/screens/event_detail_screen.dart';
import '../../features/events/screens/event_creation_screen.dart';
import '../../features/events/screens/organizer_dashboard_screen.dart';
import '../../features/events/screens/my_registrations_screen.dart';
import '../../features/events/screens/bookmarks_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/team/screens/create_team_screen.dart';
import '../../features/team/screens/join_team_screen.dart';
import '../../features/team/screens/team_list_screen.dart';
import '../../features/team/screens/team_detail_screen.dart';
import '../../features/team/screens/team_chat_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/change_password_screen.dart';
import '../../shared/screens/privacy_policy_screen.dart';
import '../../shared/screens/terms_of_service_screen.dart';
import '../../shared/widgets/orin_nav_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final userDoc = ref.watch(userDocProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      if (authState.isLoading) {
        return state.matchedLocation == '/splash' ? null : '/splash';
      }

      final loggedIn = authState.valueOrNull != null;
      final loggingIn = state.matchedLocation == '/login' || 
                        state.matchedLocation == '/signup';

      if (!loggedIn) {
        return loggingIn ? null : '/login';
      }

      if (userDoc.isLoading) {
        return state.matchedLocation == '/splash' ? null : '/splash';
      }

      final data = userDoc.valueOrNull?.data() as Map<String, dynamic>?;
      final hasRole = data?['role'] != null && (data?['role'] as String).isNotEmpty;
      final profileComplete = data?['profileComplete'] == true;

      if (!hasRole) {
        if (state.matchedLocation != '/role') return '/role';
        return null;
      }

      if (!profileComplete) {
        if (state.matchedLocation != '/profile-setup') return '/profile-setup';
        return null;
      }

      if (loggingIn || state.matchedLocation == '/role' || state.matchedLocation == '/profile-setup' || state.matchedLocation == '/splash') {
        return '/feed';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(path: '/role', builder: (_, __) => const RoleSelectionScreen()),
      GoRoute(path: '/profile-setup', builder: (_, __) => const ProfileSetupScreen()),
      
      // Main App Shell with Bottom Nav
      ShellRoute(
        builder: (context, state, child) => OrinNavShell(child: child),
        routes: [
          GoRoute(path: '/feed', builder: (_, __) => const EventFeedScreen()),
          GoRoute(path: '/my-registrations', builder: (_, __) => const MyRegistrationsScreen()),
          GoRoute(path: '/organizer', builder: (_, __) => const OrganizerDashboardScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),

      // Full screen routes
      GoRoute(
        path: '/event/:id',
        builder: (_, state) => EventDetailScreen(eventId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/create-event',
        builder: (_, __) => const EventCreationScreen(),
      ),
      GoRoute(
        path: '/edit-event/:eventId',
        builder: (_, state) => EventCreationScreen(eventId: state.pathParameters['eventId']),
      ),
      GoRoute(
        path: '/bookmarks',
        builder: (_, __) => const BookmarksScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/edit-profile',
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/teams',
        builder: (_, __) => const TeamListScreen(),
      ),
      GoRoute(
        path: '/team/:teamId',
        builder: (_, state) => TeamDetailScreen(teamId: state.pathParameters['teamId']!),
      ),
      GoRoute(
        path: '/team/:teamId/chat',
        builder: (_, state) => TeamChatScreen(teamId: state.pathParameters['teamId']!),
      ),
      GoRoute(
        path: '/create-team/:eventId',
        builder: (_, state) => CreateTeamScreen(eventId: state.pathParameters['eventId']!),
      ),
      GoRoute(
        path: '/join-team/:eventId',
        builder: (_, state) => JoinTeamScreen(eventId: state.pathParameters['eventId']!),
      ),
      GoRoute(
        path: '/privacy-policy',
        builder: (_, __) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/terms-of-service',
        builder: (_, __) => const TermsOfServiceScreen(),
      ),
    ],
  );
});
