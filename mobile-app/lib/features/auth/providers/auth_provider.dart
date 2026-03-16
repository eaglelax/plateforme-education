import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/auth_state.dart';
import '../models/enfant_model.dart';
import '../services/auth_service.dart';

/// Dio instance provider (without auth interceptor, for auth calls)
final _authDioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    // LWS shared hosting can be slow - increased timeout
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 45),
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  ));
});

/// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(_authDioProvider));
});

/// Main auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
});

/// List of children for the logged-in parent
final enfantsProvider = FutureProvider<List<EnfantModel>>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isParent) return [];
  return ref.watch(authServiceProvider).getEnfants();
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState.initial());

  /// Try to restore session from stored tokens
  Future<void> tryAutoLogin() async {
    state = AuthState.loading();

    try {
      final token = await SecureStorage.getAccessToken();
      if (token == null) {
        state = AuthState.unauthenticated();
        return;
      }

      final result = await _authService.getMe();

      if (result.type == 'enfant' && result.enfant != null) {
        state = AuthState.authenticatedEnfant(result.enfant!);
      } else if (result.user != null) {
        state = AuthState.authenticatedParent(result.user!);
      } else {
        state = AuthState.unauthenticated();
      }
    } on DioException catch (e) {
      // Token expired, try refresh
      if (e.response?.statusCode == 401) {
        try {
          final refreshResult = await _authService.refreshToken();
          await SecureStorage.saveTokens(
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken,
          );
          // Retry getMe
          final result = await _authService.getMe();
          if (result.type == 'enfant' && result.enfant != null) {
            state = AuthState.authenticatedEnfant(result.enfant!);
          } else if (result.user != null) {
            state = AuthState.authenticatedParent(result.user!);
          }
        } catch (_) {
          await SecureStorage.clearAll();
          state = AuthState.unauthenticated();
        }
      } else {
        state = AuthState.unauthenticated();
      }
    } catch (_) {
      state = AuthState.unauthenticated();
    }
  }

  /// Login as parent
  Future<void> loginParent({
    required String identifiant,
    required String motDePasse,
  }) async {
    state = AuthState.loading();

    try {
      final result = await _authService.loginParent(
        identifiant: identifiant,
        motDePasse: motDePasse,
      );

      await SecureStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      await SecureStorage.saveUserType('parent');
      await SecureStorage.saveUserId(result.user.id.toString());

      state = AuthState.authenticatedParent(result.user);
    } on DioException catch (e) {
      state = AuthState.error(AuthService.parseError(e));
    } catch (e) {
      state = AuthState.error('Erreur inattendue. Réessayez.');
    }
  }

  /// Login as child
  Future<void> loginEnfant({
    required String codeConnexion,
    String? motDePasse,
    String? pin,
  }) async {
    state = AuthState.loading();

    try {
      final result = await _authService.loginEnfant(
        codeConnexion: codeConnexion,
        motDePasse: motDePasse,
        pin: pin,
      );

      await SecureStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      await SecureStorage.saveUserType('enfant');
      await SecureStorage.saveEnfantId(result.enfant.id.toString());

      state = AuthState.authenticatedEnfant(result.enfant);
    } on DioException catch (e) {
      state = AuthState.error(AuthService.parseError(e));
    } catch (e) {
      state = AuthState.error('Erreur inattendue. Réessayez.');
    }
  }

  /// Register a new parent account
  Future<void> register({
    required String nom,
    required String prenom,
    required String telephone,
    String? email,
    required String motDePasse,
  }) async {
    state = AuthState.loading();

    try {
      final result = await _authService.register(
        nom: nom,
        prenom: prenom,
        telephone: telephone,
        email: email,
        motDePasse: motDePasse,
      );

      await SecureStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      await SecureStorage.saveUserType('parent');
      await SecureStorage.saveUserId(result.user.id.toString());

      state = AuthState.authenticatedParent(result.user);
    } on DioException catch (e) {
      state = AuthState.error(AuthService.parseError(e));
    } catch (e) {
      state = AuthState.error('Erreur inattendue. Réessayez.');
    }
  }

  /// Logout
  Future<void> logout() async {
    await SecureStorage.clearAll();
    state = AuthState.unauthenticated();
  }

  /// Update parent profile (returns error message or null on success)
  Future<String?> updateProfile({
    required String nom,
    required String prenom,
    String? email,
  }) async {
    try {
      final updatedUser = await _authService.updateProfile(
        nom: nom,
        prenom: prenom,
        email: email,
      );
      state = AuthState.authenticatedParent(updatedUser);
      return null;
    } on DioException catch (e) {
      return AuthService.parseError(e);
    } catch (_) {
      return 'Erreur inattendue. Réessayez.';
    }
  }

  /// Clear error
  void clearError() {
    if (state.status == AuthStatus.error) {
      state = AuthState.unauthenticated();
    }
  }
}
