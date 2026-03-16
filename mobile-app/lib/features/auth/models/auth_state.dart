import 'package:equatable/equatable.dart';
import 'user_model.dart';
import 'enfant_model.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }
enum UserType { parent, enfant }

class AuthState extends Equatable {
  final AuthStatus status;
  final UserType? userType;
  final UserModel? user;
  final EnfantModel? enfant;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.userType,
    this.user,
    this.enfant,
    this.errorMessage,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get isParent => userType == UserType.parent && user != null;
  bool get isEnfant => userType == UserType.enfant && enfant != null;

  AuthState copyWith({
    AuthStatus? status,
    UserType? userType,
    UserModel? user,
    EnfantModel? enfant,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      userType: userType ?? this.userType,
      user: user ?? this.user,
      enfant: enfant ?? this.enfant,
      errorMessage: errorMessage,
    );
  }

  factory AuthState.initial() => const AuthState(status: AuthStatus.initial);
  factory AuthState.loading() => const AuthState(status: AuthStatus.loading);
  factory AuthState.unauthenticated() =>
      const AuthState(status: AuthStatus.unauthenticated);

  factory AuthState.authenticatedParent(UserModel user) => AuthState(
        status: AuthStatus.authenticated,
        userType: UserType.parent,
        user: user,
      );

  factory AuthState.authenticatedEnfant(EnfantModel enfant) => AuthState(
        status: AuthStatus.authenticated,
        userType: UserType.enfant,
        enfant: enfant,
      );

  factory AuthState.error(String message) => AuthState(
        status: AuthStatus.error,
        errorMessage: message,
      );

  @override
  List<Object?> get props => [status, userType, user, enfant, errorMessage];
}
