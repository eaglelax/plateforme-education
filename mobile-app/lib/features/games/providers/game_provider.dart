import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/settings_provider.dart';
import '../models/game_score_model.dart';

final gameScoreServiceProvider = Provider<GameScoreService>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return GameScoreService(prefs);
});

final streakProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(gameScoreServiceProvider);
  return service.getStreak();
});

final gameXpProvider = Provider<int>((ref) {
  final service = ref.watch(gameScoreServiceProvider);
  return service.getGameXp();
});

final gameLevelProvider = Provider<int>((ref) {
  final service = ref.watch(gameScoreServiceProvider);
  return service.getGameLevel();
});

final dailyChallengeCompletedProvider = Provider<bool>((ref) {
  final service = ref.watch(gameScoreServiceProvider);
  return service.isDailyChallengeCompleted();
});

final memoryPairCountProvider = Provider<int>((ref) {
  final service = ref.watch(gameScoreServiceProvider);
  return service.memoryPairCount();
});
