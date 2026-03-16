import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/utils/icon_mappings.dart';

/// Helper to convert relative URLs to absolute URLs
/// On LWS, only /?route= is routed to Node.js, so /api/stream/... paths
/// must go through the query parameter pattern.
String? _toAbsoluteUrl(String? url) {
  if (url == null || url.isEmpty) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // API stream URLs: /api/stream/... → baseUrl?route=/api/stream/...
  if (url.startsWith('/api/')) {
    return '${ApiConstants.baseUrl}?route=$url';
  }
  // Legacy /uploads/ paths (shouldn't happen anymore)
  if (url.startsWith('/')) {
    return '${ApiConstants.baseUrl}?route=/api/stream${url.replaceFirst('/uploads', '')}';
  }
  return url;
}

class ContenuModel extends Equatable {
  final int id;
  final String titre;
  final String description;
  final String type; // video, audio, quiz, jeu, document, activite
  final int domaineId;
  final String? domaineNom;
  final String? domaineIcone;
  final int? niveauId;
  final String? niveauNom;
  final int? niveauNumero;
  final int trancheAgeMin;
  final int trancheAgeMax;
  final int pointsXp;
  final bool estPremium;
  final bool estTelechargeable;
  final String? urlMedia;
  final String? urlMiniature;
  final String? mediaType;
  final int? mediaDuree; // seconds
  final int nombreVues;
  final QuizModel? quiz;

  const ContenuModel({
    required this.id,
    required this.titre,
    required this.description,
    required this.type,
    required this.domaineId,
    this.domaineNom,
    this.domaineIcone,
    this.niveauId,
    this.niveauNom,
    this.niveauNumero,
    this.trancheAgeMin = 4,
    this.trancheAgeMax = 12,
    this.pointsXp = 0,
    this.estPremium = false,
    this.estTelechargeable = false,
    this.urlMedia,
    this.urlMiniature,
    this.mediaType,
    this.mediaDuree,
    this.nombreVues = 0,
    this.quiz,
  });

  bool get hasQuiz => quiz != null || type == 'quiz';
  bool get isVideo => type == 'video';
  bool get isAudio => type == 'audio';

  /// IconData for the content type
  IconData get typeIconData => AppIcons.fromContentType(type);

  /// IconData for the associated domain
  IconData get domaineIconData {
    if (domaineIcone != null && domaineIcone!.isNotEmpty) {
      return AppIcons.fromEmoji(domaineIcone);
    }
    if (domaineNom != null) return AppIcons.fromDomainName(domaineNom!);
    return AppIcons.book;
  }

  factory ContenuModel.fromJson(Map<String, dynamic> json) {
    return ContenuModel(
      id: json['id'] as int,
      titre: json['titre'] as String,
      description: (json['description'] ?? '') as String,
      type: json['type'] as String,
      domaineId: json['domaine_id'] as int,
      domaineNom: json['domaine_nom'] as String?,
      domaineIcone: json['domaine_icone'] as String?,
      niveauId: json['niveau_id'] as int?,
      niveauNom: json['niveau_nom'] as String?,
      niveauNumero: json['niveau_numero'] as int?,
      trancheAgeMin: (json['tranche_age_min'] ?? 4) as int,
      trancheAgeMax: (json['tranche_age_max'] ?? 12) as int,
      pointsXp: (json['points_xp'] ?? 0) as int,
      estPremium: json['est_premium'] == true || json['est_premium'] == 1,
      estTelechargeable: json['est_telechargeable'] == true || json['est_telechargeable'] == 1,
      urlMedia: _toAbsoluteUrl(json['urlMedia'] ?? json['url_media']),
      urlMiniature: _toAbsoluteUrl(json['urlMiniature'] ?? json['url_miniature']),
      mediaType: json['media_type'] as String?,
      mediaDuree: json['media_duree'] as int?,
      nombreVues: (json['nombre_vues'] ?? 0) as int,
      quiz: json['quiz'] != null
          ? QuizModel.fromJson(json['quiz'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  List<Object?> get props => [id, titre, type, domaineId];
}

class QuizModel extends Equatable {
  final int id;
  final int contenuId;
  final String titre;
  final String? description;
  final int? tempsLimiteMinutes;
  final int scoreMinimum;
  final bool melangerQuestions;
  final bool afficherCorrection;
  final int nombreQuestions;
  final List<QuestionModel> questions;

  const QuizModel({
    required this.id,
    required this.contenuId,
    required this.titre,
    this.description,
    this.tempsLimiteMinutes,
    this.scoreMinimum = 50,
    this.melangerQuestions = false,
    this.afficherCorrection = true,
    this.nombreQuestions = 0,
    this.questions = const [],
  });

  factory QuizModel.fromJson(Map<String, dynamic> json) {
    final questions = (json['questions'] as List?)
            ?.map((q) => QuestionModel.fromJson(q as Map<String, dynamic>))
            .toList() ??
        [];
    return QuizModel(
      id: json['id'] as int,
      contenuId: json['contenu_id'] as int,
      titre: (json['titre'] ?? 'Quiz') as String,
      description: json['description'] as String?,
      tempsLimiteMinutes: json['temps_limite_minutes'] as int?,
      scoreMinimum: (json['score_minimum'] ?? 50) as int,
      melangerQuestions: json['melanger_questions'] == true,
      afficherCorrection: json['afficher_correction'] != false,
      nombreQuestions: (json['nombre_questions'] ?? questions.length) as int,
      questions: questions,
    );
  }

  @override
  List<Object?> get props => [id, contenuId];
}

class QuestionModel extends Equatable {
  final int id;
  final String texte;
  final String type; // choix_unique, choix_multiple, vrai_faux
  final String? imageUrl;
  final String? explication;
  final int points;
  final int ordre;
  final List<ReponseModel> reponses;

  const QuestionModel({
    required this.id,
    required this.texte,
    this.type = 'choix_unique',
    this.imageUrl,
    this.explication,
    this.points = 1,
    this.ordre = 0,
    this.reponses = const [],
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['id'] as int,
      texte: json['texte'] as String,
      type: (json['type'] ?? 'choix_unique') as String,
      imageUrl: _toAbsoluteUrl(json['image_url']),
      explication: json['explication'] as String?,
      points: (json['points'] ?? 1) as int,
      ordre: (json['ordre'] ?? 0) as int,
      reponses: (json['reponses'] as List?)
              ?.map((r) => ReponseModel.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  @override
  List<Object?> get props => [id, texte];
}

class ReponseModel extends Equatable {
  final int id;
  final String texte;
  final bool estCorrecte;
  final int ordre;

  const ReponseModel({
    required this.id,
    required this.texte,
    this.estCorrecte = false,
    this.ordre = 0,
  });

  factory ReponseModel.fromJson(Map<String, dynamic> json) {
    return ReponseModel(
      id: json['id'] as int,
      texte: json['texte'] as String,
      estCorrecte: json['est_correcte'] == true || json['est_correcte'] == 1,
      ordre: (json['ordre'] ?? 0) as int,
    );
  }

  @override
  List<Object?> get props => [id, texte, estCorrecte];
}
