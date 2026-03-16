import 'package:shared_preferences/shared_preferences.dart';

/// Service for tracking game scores, streaks, XP and daily challenge via SharedPreferences
class GameScoreService {
  static const _streakKey = 'game_streak';
  static const _lastPlayedKey = 'game_last_played';
  static const _gameXpKey = 'game_xp';
  static const _dailyChallengePrefix = 'daily_challenge_';

  final SharedPreferences _prefs;

  GameScoreService(this._prefs);

  // --- Streak ---

  /// Get current streak (consecutive days of play)
  int getStreak() {
    final streak = _prefs.getInt(_streakKey) ?? 0;
    final lastPlayed = _prefs.getString(_lastPlayedKey);
    if (lastPlayed == null) return 0;

    final lastDate = DateTime.tryParse(lastPlayed);
    if (lastDate == null) return 0;

    final today = DateTime.now();
    final diff = DateTime(today.year, today.month, today.day)
        .difference(DateTime(lastDate.year, lastDate.month, lastDate.day))
        .inDays;

    if (diff > 1) return 0;
    return streak;
  }

  /// Record a play session and update streak
  Future<void> recordPlay() async {
    final today = DateTime.now();
    final todayStr =
        '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final lastPlayed = _prefs.getString(_lastPlayedKey);

    if (lastPlayed == todayStr) return;

    final currentStreak = getStreak();
    final lastDate = lastPlayed != null ? DateTime.tryParse(lastPlayed) : null;

    int newStreak;
    if (lastDate != null) {
      final diff = DateTime(today.year, today.month, today.day)
          .difference(
              DateTime(lastDate.year, lastDate.month, lastDate.day))
          .inDays;
      newStreak = diff == 1 ? currentStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    await _prefs.setInt(_streakKey, newStreak);
    await _prefs.setString(_lastPlayedKey, todayStr);
  }

  // --- Game XP & Level ---

  int getGameXp() => _prefs.getInt(_gameXpKey) ?? 0;

  Future<void> addGameXp(int xp) async {
    final current = getGameXp();
    await _prefs.setInt(_gameXpKey, current + xp);
  }

  /// Level: 0-49→1, 50-149→2, 150-299→3, 300-499→4, 500+→5
  int getGameLevel() {
    final xp = getGameXp();
    if (xp >= 500) return 5;
    if (xp >= 300) return 4;
    if (xp >= 150) return 3;
    if (xp >= 50) return 2;
    return 1;
  }

  /// Memory game pair count based on level: 1-2→4, 3→6, 4-5→8
  int memoryPairCount() {
    final level = getGameLevel();
    if (level >= 4) return 8;
    if (level >= 3) return 6;
    return 4;
  }

  // --- Daily Challenge ---

  static String _todayKey() {
    final today = DateTime.now();
    return '$_dailyChallengePrefix${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
  }

  bool isDailyChallengeCompleted() => _prefs.getBool(_todayKey()) ?? false;

  Future<void> completeDailyChallenge() async {
    await _prefs.setBool(_todayKey(), true);
  }
}
