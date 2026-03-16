import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userTypeKey = 'user_type'; // 'parent' or 'enfant'
  static const _userIdKey = 'user_id';
  static const _enfantIdKey = 'enfant_id';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> saveUserType(String type) async {
    await _storage.write(key: _userTypeKey, value: type);
  }

  static Future<String?> getUserType() async {
    return await _storage.read(key: _userTypeKey);
  }

  static Future<void> saveUserId(String id) async {
    await _storage.write(key: _userIdKey, value: id);
  }

  static Future<void> saveEnfantId(String id) async {
    await _storage.write(key: _enfantIdKey, value: id);
  }

  static Future<String?> getEnfantId() async {
    return await _storage.read(key: _enfantIdKey);
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
