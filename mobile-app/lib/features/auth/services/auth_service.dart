import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../models/enfant_model.dart';

class AuthService {
  final Dio _dio;

  AuthService(this._dio);

  /// Login parent with phone/email + password
  Future<({UserModel user, String accessToken, String refreshToken})>
      loginParent({
    required String identifiant,
    required String motDePasse,
  }) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {
        'identifiant': identifiant,
        'motDePasse': motDePasse,
      },
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return (
      user: UserModel.fromJson(data['utilisateur'] as Map<String, dynamic>),
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  /// Login child with code + password or PIN
  Future<({EnfantModel enfant, String accessToken, String refreshToken})>
      loginEnfant({
    required String codeConnexion,
    String? motDePasse,
    String? pin,
  }) async {
    final body = <String, dynamic>{
      'codeConnexion': codeConnexion,
    };
    if (motDePasse != null) body['motDePasse'] = motDePasse;
    if (pin != null) body['pin'] = pin;

    final response = await _dio.post(
      ApiConstants.loginEnfant,
      data: body,
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return (
      enfant: EnfantModel.fromJson(data['enfant'] as Map<String, dynamic>),
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  /// Register a new parent account
  Future<({UserModel user, String accessToken, String refreshToken})>
      register({
    required String nom,
    required String prenom,
    required String telephone,
    String? email,
    required String motDePasse,
  }) async {
    final body = <String, dynamic>{
      'nom': nom,
      'prenom': prenom,
      'telephone': telephone,
      'motDePasse': motDePasse,
    };
    if (email != null && email.isNotEmpty) body['email'] = email;

    final response = await _dio.post(
      ApiConstants.register,
      data: body,
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return (
      user: UserModel.fromJson(data['utilisateur'] as Map<String, dynamic>),
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  /// Request password reset via phone number
  Future<String> forgotPassword({required String telephone}) async {
    final response = await _dio.post(
      ApiConstants.forgotPassword,
      data: {'telephone': telephone},
    );
    return (response.data['message'] ?? 'Un SMS a été envoyé.') as String;
  }

  /// Update parent profile
  Future<UserModel> updateProfile({
    required String nom,
    required String prenom,
    String? email,
  }) async {
    final token = await SecureStorage.getAccessToken();
    final response = await _dio.put(
      ApiConstants.profil,
      data: {
        'nom': nom,
        'prenom': prenom,
        if (email != null && email.isNotEmpty) 'email': email,
      },
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  /// Get current user profile from token
  Future<({String type, UserModel? user, EnfantModel? enfant})>
      getMe() async {
    final token = await SecureStorage.getAccessToken();
    if (token == null) throw Exception('No token');

    final response = await _dio.get(
      ApiConstants.me,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );

    final data = response.data['data'] as Map<String, dynamic>;
    final type = data['type'] as String;

    if (type == 'enfant') {
      return (
        type: type,
        user: null,
        enfant: EnfantModel.fromJson(data['profil'] as Map<String, dynamic>),
      );
    } else {
      return (
        type: type,
        user: UserModel.fromJson(data['profil'] as Map<String, dynamic>),
        enfant: null,
      );
    }
  }

  /// Refresh access token
  Future<({String accessToken, String refreshToken})> refreshToken() async {
    final currentRefreshToken = await SecureStorage.getRefreshToken();
    if (currentRefreshToken == null) throw Exception('No refresh token');

    final response = await _dio.post(
      ApiConstants.refreshToken,
      data: {'refreshToken': currentRefreshToken},
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return (
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  /// Get list of children for parent
  Future<List<EnfantModel>> getEnfants() async {
    final token = await SecureStorage.getAccessToken();
    final response = await _dio.get(
      ApiConstants.enfants,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );

    final data = response.data['data'] as List;
    return data
        .map((e) => EnfantModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Parse API error message from DioException
  static String parseError(DioException e) {
    if (e.response?.data is Map) {
      final message = (e.response!.data as Map)['message'];
      if (message != null) return message.toString();
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connexion au serveur impossible. Vérifiez votre connexion internet.';
      case DioExceptionType.connectionError:
        return 'Impossible de joindre le serveur. Réessayez plus tard.';
      default:
        return 'Une erreur est survenue. Réessayez.';
    }
  }
}
