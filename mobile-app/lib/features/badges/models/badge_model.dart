import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/icon_mappings.dart';

class BadgeModel extends Equatable {
  final int id;
  final String nom;
  final String description;
  final String? type;
  final String? iconeUrl;
  final String? conditionObtention;
  final int pointsBonus;
  final bool estActif;
  final String? dateObtention;

  const BadgeModel({
    required this.id,
    required this.nom,
    required this.description,
    this.type,
    this.iconeUrl,
    this.conditionObtention,
    this.pointsBonus = 0,
    this.estActif = true,
    this.dateObtention,
  });

  bool get isObtained => dateObtention != null;

  /// IconData for the badge
  IconData get displayIconData => AppIcons.fromBadgeType(type);

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id'] as int,
      nom: json['nom'] as String,
      description: (json['description'] ?? '') as String,
      type: json['type'] as String?,
      iconeUrl: json['icone_url'] as String?,
      conditionObtention: json['condition_obtention'] as String?,
      pointsBonus: (json['points_bonus'] ?? 0) as int,
      estActif: json['est_actif'] != false,
      dateObtention: json['date_obtention'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, nom];
}

class HistoriqueModel extends Equatable {
  /// IconData for the associated domain
  IconData get domaineIconData {
    if (domaineIcone != null && domaineIcone!.isNotEmpty) {
      return AppIcons.fromEmoji(domaineIcone);
    }
    if (domaineNom != null) return AppIcons.fromDomainName(domaineNom!);
    return AppIcons.book;
  }

  final int id;
  final int contenuId;
  final String titre;
  final String type;
  final double progression;
  final bool estComplete;
  final int? score;
  final int pointsGagnes;
  final int tempsPasseSecondes;
  final String dateAcces;
  final String? urlMiniature;
  final String? domaineNom;
  final String? domaineIcone;

  const HistoriqueModel({
    required this.id,
    required this.contenuId,
    required this.titre,
    required this.type,
    this.progression = 0,
    this.estComplete = false,
    this.score,
    this.pointsGagnes = 0,
    this.tempsPasseSecondes = 0,
    required this.dateAcces,
    this.urlMiniature,
    this.domaineNom,
    this.domaineIcone,
  });

  factory HistoriqueModel.fromJson(Map<String, dynamic> json) {
    return HistoriqueModel(
      id: json['id'] as int,
      contenuId: json['contenu_id'] as int,
      titre: json['titre'] as String,
      type: json['type'] as String,
      progression: (json['progression'] as num?)?.toDouble() ?? 0,
      estComplete: json['est_complete'] == true || json['est_complete'] == 1,
      score: json['score'] as int?,
      pointsGagnes: (json['points_gagnes'] ?? 0) as int,
      tempsPasseSecondes: (json['temps_passe_secondes'] ?? 0) as int,
      dateAcces: json['date_acces'] as String,
      urlMiniature: json['url_miniature'] as String?,
      domaineNom: json['domaine_nom'] as String?,
      domaineIcone: json['domaine_icone'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, contenuId];
}
