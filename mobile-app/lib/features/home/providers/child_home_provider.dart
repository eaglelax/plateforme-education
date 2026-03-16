import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';
import '../../domains/models/domaine_model.dart';
import '../../content/models/contenu_model.dart';
import '../../badges/models/badge_model.dart';

/// Domains list
final domainesProvider = FutureProvider<List<DomaineModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get(ApiConstants.domaines);
  final data = response.data['data'] as List;
  return data
      .map((d) => DomaineModel.fromJson(d as Map<String, dynamic>))
      .toList();
});

/// Published content list (optionally filtered by domain)
final contenusProvider =
    FutureProvider.family<List<ContenuModel>, int?>((ref, domaineId) async {
  final apiClient = ref.watch(apiClientProvider);
  final params = <String, dynamic>{'limit': '50'};
  if (domaineId != null) params['domaineId'] = domaineId.toString();

  final response = await apiClient.get(
    ApiConstants.contenus,
    queryParameters: params,
  );
  final data = response.data['data'] as List;
  return data
      .map((c) => ContenuModel.fromJson(c as Map<String, dynamic>))
      .toList();
});

/// Single content detail with quiz
final contenuDetailProvider =
    FutureProvider.family<ContenuModel, int>((ref, contenuId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get(ApiConstants.contenuById(contenuId));
  return ContenuModel.fromJson(response.data['data'] as Map<String, dynamic>);
});

/// Quiz for a content - reuses data from contenuDetailProvider (which includes quiz)
/// Falls back to separate API call only if content detail not available
final quizProvider =
    FutureProvider.family<QuizModel?, int>((ref, contenuId) async {
  // First: try to get quiz from the already-loaded content detail
  final contenuAsync = ref.watch(contenuDetailProvider(contenuId));
  final contenu = contenuAsync.valueOrNull;
  if (contenu?.quiz != null) {
    return contenu!.quiz;
  }

  // Fallback: separate API call (may fail for enfant role)
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get(ApiConstants.quizByContenu(contenuId));
    if (response.data['data'] == null) return null;
    return QuizModel.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (e) {
    return null;
  }
});

/// Child's learning history (recent activity)
final monHistoriqueProvider =
    FutureProvider<List<HistoriqueModel>>((ref) async {
  ref.watch(authProvider); // rebuild when auth changes
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get(
    ApiConstants.monHistorique,
    queryParameters: {'limit': '10'},
  );
  final data = response.data['data'] as List;
  return data
      .map((h) => HistoriqueModel.fromJson(h as Map<String, dynamic>))
      .toList();
});

/// Child's last in-progress content (for "continue" card)
final lastInProgressProvider = FutureProvider<HistoriqueModel?>((ref) async {
  ref.watch(authProvider);
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get(
      ApiConstants.monHistorique,
      queryParameters: {'limit': '1', 'complete': 'false'},
    );
    final data = response.data['data'] as List;
    if (data.isEmpty) return null;
    return HistoriqueModel.fromJson(data.first as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

/// Child's own badges
final mesBadgesProvider = FutureProvider<({
  List<BadgeModel> obtenus,
  List<BadgeModel> aObtenir,
  int totalObtenus,
})>((ref) async {
  ref.watch(authProvider);
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get(ApiConstants.mesBadges);
  final data = response.data['data'] as Map<String, dynamic>;
  return (
    obtenus: (data['obtenus'] as List)
        .map((b) => BadgeModel.fromJson(b as Map<String, dynamic>))
        .toList(),
    aObtenir: (data['aObtenir'] as List)
        .map((b) => BadgeModel.fromJson(b as Map<String, dynamic>))
        .toList(),
    totalObtenus: (data['totalObtenus'] ?? 0) as int,
  );
});

/// Start a content (creates historique entry)
Future<int> demarrerContenu(ApiClient apiClient, int contenuId) async {
  final response = await apiClient.post(ApiConstants.demarrerContenu(contenuId));
  return response.data['data']['historiqueId'] as int;
}

/// Update content progression
Future<void> updateProgression(
    ApiClient apiClient, int contenuId, int progression,
    {int? tempsPasse}) async {
  await apiClient.post(
    ApiConstants.progressionContenu(contenuId),
    data: {
      'progression': progression,
      if (tempsPasse != null) 'tempsPasse': tempsPasse,
    },
  );
}

/// Complete a content
Future<int> terminerContenu(ApiClient apiClient, int contenuId,
    {int? score}) async {
  final response = await apiClient.post(
    ApiConstants.terminerContenu(contenuId),
    data: {if (score != null) 'score': score},
  );
  return (response.data['data']['pointsGagnes'] ?? 0) as int;
}

/// Submit quiz result — saves score, awards XP, checks badges, auto level-up
/// Returns full result data from API
Future<QuizResultData> submitQuizResult(
    ApiClient apiClient, int contenuId, int score, int totalQuestions) async {
  final response = await apiClient.post(
    ApiConstants.quizResultat(contenuId),
    data: {'score': score, 'totalQuestions': totalQuestions},
  );
  final data = response.data['data'] as Map<String, dynamic>;
  return QuizResultData.fromJson(data);
}

/// Sync game XP to server
Future<void> syncGameXp(ApiClient apiClient, int gameXp) async {
  await apiClient.post(
    ApiConstants.syncGameXp,
    data: {'gameXp': gameXp},
  );
}

/// Quiz result data from API
class QuizResultData {
  final int score;
  final int totalQuestions;
  final int percentage;
  final bool passed;
  final int bestScore;
  final bool isNewBest;
  final int pointsGagnes;
  final int totalXp;
  final int niveau;
  final int niveauPrecedent;
  final bool leveledUp;
  final int xpPourProchainNiveau;
  final List<String> newBadges;

  QuizResultData({
    required this.score,
    required this.totalQuestions,
    required this.percentage,
    required this.passed,
    required this.bestScore,
    required this.isNewBest,
    required this.pointsGagnes,
    required this.totalXp,
    required this.niveau,
    required this.niveauPrecedent,
    required this.leveledUp,
    required this.xpPourProchainNiveau,
    required this.newBadges,
  });

  factory QuizResultData.fromJson(Map<String, dynamic> json) {
    return QuizResultData(
      score: json['score'] as int? ?? 0,
      totalQuestions: json['totalQuestions'] as int? ?? 0,
      percentage: json['percentage'] as int? ?? 0,
      passed: json['passed'] as bool? ?? false,
      bestScore: json['bestScore'] as int? ?? 0,
      isNewBest: json['isNewBest'] as bool? ?? false,
      pointsGagnes: json['pointsGagnes'] as int? ?? 0,
      totalXp: json['totalXp'] as int? ?? 0,
      niveau: json['niveau'] as int? ?? 1,
      niveauPrecedent: json['niveauPrecedent'] as int? ?? 1,
      leveledUp: json['leveledUp'] as bool? ?? false,
      xpPourProchainNiveau: json['xpPourProchainNiveau'] as int? ?? 100,
      newBadges: (json['newBadges'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

/// Level system helpers (matches API progressive formula)
class LevelSystem {
  /// XP threshold for a given level
  /// Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 450,
  /// Level 5: 700, Level 6: 1000, Level 7: 1350, ...
  static int xpThreshold(int level) {
    if (level <= 1) return 0;
    int total = 0;
    for (int i = 2; i <= level; i++) {
      total += 100 + 50 * (i - 2);
    }
    return total;
  }

  /// Get level from total XP
  static int levelFromXp(int xp) {
    int level = 1;
    while (xpThreshold(level + 1) <= xp) {
      level++;
    }
    return level;
  }

  /// Progress within current level (0.0 to 1.0)
  static double progressInLevel(int xp) {
    final level = levelFromXp(xp);
    final currentThreshold = xpThreshold(level);
    final nextThreshold = xpThreshold(level + 1);
    final gap = nextThreshold - currentThreshold;
    if (gap <= 0) return 1.0;
    return (xp - currentThreshold) / gap;
  }

  /// XP remaining to reach next level
  static int xpToNextLevel(int xp) {
    final level = levelFromXp(xp);
    return xpThreshold(level + 1) - xp;
  }
}
