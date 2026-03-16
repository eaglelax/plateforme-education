import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../../auth/models/enfant_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/abonnement_model.dart';
import '../models/parametres_parentaux_model.dart';
import '../models/statistiques_model.dart';
import '../../payment/models/paiement_model.dart';

final _dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));
});

Future<Options> _authOptions() async {
  final token = await SecureStorage.getAccessToken();
  return Options(headers: {
    'Authorization': 'Bearer $token',
    'Cache-Control': 'no-cache',
  });
}

// =========================================
// ENFANTS (liste pour parent)
// =========================================

/// Liste des enfants du parent connecté
final parentEnfantsProvider = FutureProvider<List<EnfantModel>>((ref) async {
  ref.watch(authProvider);
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.enfants,
    options: await _authOptions(),
  );
  final data = response.data['data'] as List;
  return data.map((e) => EnfantModel.fromJson(e as Map<String, dynamic>)).toList();
});

/// Détail d'un enfant (avec abonnement, badges, params)
final enfantDetailProvider =
    FutureProvider.family<EnfantModel, int>((ref, enfantId) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.enfantById(enfantId),
    options: await _authOptions(),
  );
  return EnfantModel.fromJson(response.data['data'] as Map<String, dynamic>);
});

// =========================================
// ABONNEMENTS
// =========================================

/// Types d'abonnement disponibles (plans)
final abonnementTypesProvider =
    FutureProvider<List<AbonnementType>>((ref) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(ApiConstants.typesAbonnements);
  final data = response.data['data'] as List;
  return data
      .map((t) => AbonnementType.fromJson(t as Map<String, dynamic>))
      .toList();
});

/// Abonnements du parent
final abonnementsProvider = FutureProvider<List<Abonnement>>((ref) async {
  ref.watch(authProvider);
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.abonnements,
    options: await _authOptions(),
  );
  final data = response.data['data'] as List;
  return data
      .map((a) => Abonnement.fromJson(a as Map<String, dynamic>))
      .toList();
});

/// Créer un abonnement pour un enfant
Future<Abonnement> creerAbonnement(
    Dio dio, int enfantId, int typeAbonnementId) async {
  final response = await dio.post(
    ApiConstants.abonnements,
    data: {
      'enfantId': enfantId,
      'typeAbonnementId': typeAbonnementId,
    },
    options: await _authOptions(),
  );
  return Abonnement.fromJson(response.data['data'] as Map<String, dynamic>);
}

/// Toggle renouvellement auto
Future<void> toggleRenouvellement(Dio dio, int abonnementId, bool actif) async {
  await dio.put(
    ApiConstants.abonnementRenouvellement(abonnementId),
    data: {'actif': actif},
    options: await _authOptions(),
  );
}

/// Annuler un abonnement
Future<void> annulerAbonnement(Dio dio, int abonnementId, {String? motif}) async {
  await dio.post(
    ApiConstants.abonnementAnnuler(abonnementId),
    data: motif != null ? {'motif': motif} : {},
    options: await _authOptions(),
  );
}

// =========================================
// PARAMETRES PARENTAUX
// =========================================

/// Paramètres parentaux d'un enfant
final parametresParentauxProvider =
    FutureProvider.family<ParametresParentaux, int>((ref, enfantId) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.parametresParentaux(enfantId),
    options: await _authOptions(),
  );
  return ParametresParentaux.fromJson(
      response.data['data'] as Map<String, dynamic>);
});

/// Sauvegarder les paramètres parentaux
Future<void> sauvegarderParametres(
    Dio dio, int enfantId, ParametresParentaux params) async {
  await dio.put(
    ApiConstants.parametresParentaux(enfantId),
    data: params.toJson(),
    options: await _authOptions(),
  );
}

// =========================================
// STATISTIQUES / HISTORIQUE ENFANT
// =========================================

/// Résumé statistiques d'un enfant (avec période)
final statistiquesEnfantProvider = FutureProvider.family<StatistiquesEnfant,
    ({int enfantId, int periode})>((ref, params) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.resumeEnfant(params.enfantId),
    queryParameters: {'periode': params.periode.toString()},
    options: await _authOptions(),
  );
  return StatistiquesEnfant.fromJson(
      response.data['data'] as Map<String, dynamic>);
});

/// Temps d'écran d'un enfant
final tempsEcranProvider = FutureProvider.family<TempsEcranData,
    ({int enfantId, int periode})>((ref, params) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.tempsEcranEnfant(params.enfantId),
    queryParameters: {'periode': params.periode.toString()},
    options: await _authOptions(),
  );
  return TempsEcranData.fromJson(
      response.data['data'] as Map<String, dynamic>);
});

/// Progression détaillée par domaine
final progressionEnfantProvider =
    FutureProvider.family<ProgressionEnfant, int>((ref, enfantId) async {
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.progressionEnfant(enfantId),
    options: await _authOptions(),
  );
  return ProgressionEnfant.fromJson(
      response.data['data'] as Map<String, dynamic>);
});

// =========================================
// PAIEMENTS
// =========================================

/// Initier un paiement Mobile Money
Future<Paiement> initierPaiement(Dio dio, PaymentRequest request) async {
  final response = await dio.post(
    ApiConstants.paiements,
    data: request.toJson(),
    options: await _authOptions(),
  );
  return Paiement.fromJson(response.data['data'] as Map<String, dynamic>);
}

/// Vérifier le statut d'un paiement
Future<Paiement> verifierPaiement(Dio dio, int paiementId) async {
  final response = await dio.post(
    ApiConstants.paiementVerifier(paiementId),
    options: await _authOptions(),
  );
  return Paiement.fromJson(response.data['data'] as Map<String, dynamic>);
}

/// Historique des paiements
final paiementsHistoriqueProvider =
    FutureProvider<List<Paiement>>((ref) async {
  ref.watch(authProvider);
  final dio = ref.watch(_dioProvider);
  final response = await dio.get(
    ApiConstants.paiements,
    queryParameters: {'limit': '20'},
    options: await _authOptions(),
  );
  final data = response.data['data'] as List;
  return data
      .map((p) => Paiement.fromJson(p as Map<String, dynamic>))
      .toList();
});

// =========================================
// GESTION ENFANTS (CRUD)
// =========================================

/// Créer un profil enfant
Future<EnfantModel> creerEnfant(Dio dio, {
  required String nomPseudo,
  required int age,
  String? avatar,
  String modeConnexion = 'mot_de_passe',
}) async {
  final response = await dio.post(
    ApiConstants.enfants,
    data: {
      'nomPseudo': nomPseudo,
      'age': age,
      if (avatar != null) 'avatar': avatar,
      'modeConnexion': modeConnexion,
    },
    options: await _authOptions(),
  );
  return EnfantModel.fromJson(response.data['data'] as Map<String, dynamic>);
}

/// Modifier un profil enfant
Future<void> modifierEnfant(Dio dio, int enfantId, Map<String, dynamic> data) async {
  await dio.put(
    ApiConstants.enfantById(enfantId),
    data: data,
    options: await _authOptions(),
  );
}

/// Supprimer un profil enfant
Future<void> supprimerEnfant(Dio dio, int enfantId) async {
  await dio.delete(
    ApiConstants.enfantById(enfantId),
    options: await _authOptions(),
  );
}

/// Récupérer les identifiants d'un enfant
Future<Map<String, dynamic>> getIdentifiantsEnfant(
    Dio dio, int enfantId) async {
  final response = await dio.get(
    ApiConstants.enfantIdentifiants(enfantId),
    options: await _authOptions(),
  );
  return response.data['data'] as Map<String, dynamic>;
}

/// Provider Dio exposé pour les fonctions utilitaires
final parentDioProvider = Provider<Dio>((ref) => ref.watch(_dioProvider));
