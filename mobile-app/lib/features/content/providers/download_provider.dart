import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/download_database.dart';
import '../services/download_service.dart';

final _downloadDioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(minutes: 10),
  ));
});

final downloadServiceProvider = Provider<DownloadService>((ref) {
  return DownloadService(ref.watch(_downloadDioProvider));
});

/// List of all downloaded contents (metadata from DB)
final downloadedContentsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return DownloadDatabase.getDownloads();
});

/// Check if a specific content is downloaded
final isDownloadedProvider =
    FutureProvider.family<bool, int>((ref, contenuId) async {
  final service = ref.watch(downloadServiceProvider);
  return service.isDownloaded(contenuId);
});

/// Download progress tracker
class DownloadProgressNotifier extends StateNotifier<Map<int, double>> {
  DownloadProgressNotifier() : super({});

  void updateProgress(int contenuId, double progress) {
    state = {...state, contenuId: progress};
  }

  void removeProgress(int contenuId) {
    final newState = Map<int, double>.from(state);
    newState.remove(contenuId);
    state = newState;
  }

  bool isDownloading(int contenuId) => state.containsKey(contenuId);
  double? getProgress(int contenuId) => state[contenuId];
}

final downloadProgressProvider =
    StateNotifierProvider<DownloadProgressNotifier, Map<int, double>>((ref) {
  return DownloadProgressNotifier();
});
