import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Auth
import '../features/auth/models/auth_state.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';

// Child screens
import '../features/child_selection/screens/child_selection_screen.dart';
import '../features/home/screens/child_home_screen.dart';
import '../features/home/screens/child_shell_screen.dart';
import '../features/domains/screens/domain_detail_screen.dart';
import '../features/domains/screens/domains_list_screen.dart';
import '../features/content/screens/video_content_screen.dart';
import '../features/quiz/screens/quiz_screen.dart';
import '../features/quiz/screens/quiz_result_screen.dart';
import '../features/badges/screens/badges_screen.dart';

// Child games
import '../features/games/screens/games_screen.dart';
import '../features/games/screens/memory_game_screen.dart';
import '../features/games/screens/word_scramble_screen.dart';
import '../features/games/screens/math_challenge_screen.dart';

// Parent screens
import '../features/parent/dashboard/screens/parent_dashboard_screen.dart';
import '../features/parent/dashboard/screens/parent_shell_screen.dart';
import '../features/parent/children/screens/children_management_screen.dart';
import '../features/parent/parental_controls/screens/parental_controls_screen.dart';
import '../features/parent/settings/screens/parent_settings_screen.dart';
import '../features/parent/statistics/screens/child_statistics_screen.dart';

// Payment screens
import '../features/payment/screens/payment_screen.dart';
import '../features/payment/screens/payment_confirmation_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

/// Provider for GoRouter that reacts to auth state
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: _AuthRefreshNotifier(ref),
    redirect: (context, state) {
      final location = state.matchedLocation;
      final isOnSplash = location == '/splash';
      final isOnAuth = location == '/login' || location == '/register';
      final isOnChildSelection = location == '/';

      // Still loading (initial or checking tokens)
      if (authState.status == AuthStatus.initial ||
          authState.status == AuthStatus.loading) {
        return isOnSplash ? null : '/splash';
      }

      // Authenticated as parent - redirect from public pages
      if (authState.isAuthenticated && authState.isParent) {
        if (isOnSplash || isOnAuth || isOnChildSelection) {
          return '/parent/dashboard';
        }
        return null;
      }

      // Authenticated as child - redirect from public pages
      if (authState.isAuthenticated && authState.isEnfant) {
        if (isOnSplash || isOnAuth || isOnChildSelection) {
          return '/enfant/accueil';
        }
        return null;
      }

      // Unauthenticated - allow access to selection, login, register
      if (isOnSplash) return '/';
      final publicPaths = ['/', '/login', '/register'];
      if (publicPaths.contains(location)) return null;

      // Trying to access protected route while unauthenticated
      return '/';
    },
    routes: [
      // Splash screen
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Welcome / Child selection (public)
      GoRoute(
        path: '/',
        builder: (context, state) => const ChildSelectionScreen(),
      ),

      // Auth screens (public)
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // === CHILD SECTION (requires enfant auth) ===
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            ChildShellScreen(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/enfant/accueil',
                builder: (context, state) => const ChildHomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/enfant/domaines',
                builder: (context, state) => const DomainsListScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/enfant/jeux',
                builder: (context, state) => const GamesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/enfant/badges',
                builder: (context, state) => const BadgesScreen(),
              ),
            ],
          ),
        ],
      ),

      // Child detail screens (no bottom nav)
      GoRoute(
        path: '/enfant/domaine/:id',
        builder: (context, state) => DomainDetailScreen(
          domainId: int.parse(state.pathParameters['id']!),
          domainName: state.uri.queryParameters['name'] ?? 'Domaine',
        ),
      ),
      GoRoute(
        path: '/enfant/contenu/:id',
        builder: (context, state) => VideoContentScreen(
          contentId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/enfant/quiz/:id',
        builder: (context, state) => QuizScreen(
          contentId: int.parse(state.pathParameters['id']!),
        ),
      ),
      // Mini-games
      GoRoute(
        path: '/enfant/jeux/memoire',
        builder: (context, state) => const MemoryGameScreen(),
      ),
      GoRoute(
        path: '/enfant/jeux/mots',
        builder: (context, state) => const WordScrambleScreen(),
      ),
      GoRoute(
        path: '/enfant/jeux/calcul',
        builder: (context, state) => const MathChallengeScreen(),
      ),

      GoRoute(
        path: '/enfant/quiz-resultat',
        builder: (context, state) {
          final params = state.uri.queryParameters;
          return QuizResultScreen(
            score: int.tryParse(params['score'] ?? '') ?? 0,
            totalQuestions: int.tryParse(params['total'] ?? '') ?? 0,
            pointsEarned: int.tryParse(params['points'] ?? '') ?? 0,
            badgeName: params['badge'],
            contenuId: int.tryParse(params['contenuId'] ?? ''),
          );
        },
      ),

      // === PARENT SECTION (requires parent auth) ===
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            ParentShellScreen(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/dashboard',
                builder: (context, state) => const ParentDashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/enfants',
                builder: (context, state) =>
                    const ChildrenManagementScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/paiement',
                builder: (context, state) => const PaymentScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/parent/parametres',
                builder: (context, state) =>
                    const ParentSettingsScreen(),
              ),
            ],
          ),
        ],
      ),

      // Parent detail screens (no bottom nav)
      GoRoute(
        path: '/parent/controles/:enfantId',
        builder: (context, state) => ParentalControlsScreen(
          enfantId: int.parse(state.pathParameters['enfantId']!),
          enfantName: state.uri.queryParameters['name'] ?? 'Enfant',
        ),
      ),
      GoRoute(
        path: '/parent/statistiques/:enfantId',
        builder: (context, state) => ChildStatisticsScreen(
          enfantId: int.parse(state.pathParameters['enfantId']!),
          enfantName: state.uri.queryParameters['name'] ?? 'Enfant',
        ),
      ),
      GoRoute(
        path: '/parent/paiement/confirmation',
        builder: (context, state) {
          final params = state.uri.queryParameters;
          return PaymentConfirmationScreen(
            montant: int.tryParse(params['montant'] ?? '') ?? 0,
            methode: params['methode'] ?? 'orange_money',
            reference: params['reference'] ?? '',
            dateFin: params['dateFin'] ?? '',
            paiementId: int.tryParse(params['paiementId'] ?? ''),
          );
        },
      ),
    ],
  );
});

/// Bridges Riverpod state changes to GoRouter's Listenable-based refresh
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, _) {
      notifyListeners();
    });
  }

  final Ref _ref;
}
