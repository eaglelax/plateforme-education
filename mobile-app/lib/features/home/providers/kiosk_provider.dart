import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../../parent/models/parametres_parentaux_model.dart';

/// Fetches parental controls for the currently logged-in child
final childKioskProvider = FutureProvider<ParametresParentaux?>((ref) async {
  final authState = ref.watch(authProvider);
  if (!authState.isEnfant || authState.enfant == null) return null;

  final enfantId = authState.enfant!.id;
  final token = await SecureStorage.getAccessToken();
  if (token == null) return null;

  try {
    final dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));
    final response = await dio.get(
      ApiConstants.parametresParentaux(enfantId),
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return ParametresParentaux.fromJson(
        response.data['data'] as Map<String, dynamic>);
  } catch (_) {
    // On error, default to non-restrictive (don't block the child)
    return null;
  }
});

/// Simple derived provider: is kiosk mode active?
final isKioskActiveProvider = Provider<bool>((ref) {
  final params = ref.watch(childKioskProvider);
  return params.valueOrNull?.modeKiosqueActif ?? false;
});
