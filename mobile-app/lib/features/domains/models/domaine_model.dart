import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/icon_mappings.dart';

class DomaineModel extends Equatable {
  final int id;
  final String nom;
  final String description;
  final String? icone;
  final String? couleur;
  final int ordreAffichage;
  final bool estActif;
  final int contenusCount;

  const DomaineModel({
    required this.id,
    required this.nom,
    required this.description,
    this.icone,
    this.couleur,
    this.ordreAffichage = 0,
    this.estActif = true,
    this.contenusCount = 0,
  });

  /// IconData based on domain icon or name
  IconData get displayIconData {
    if (icone != null && icone!.isNotEmpty) {
      return AppIcons.fromEmoji(icone);
    }
    return AppIcons.fromDomainName(nom);
  }

  factory DomaineModel.fromJson(Map<String, dynamic> json) {
    return DomaineModel(
      id: json['id'] as int,
      nom: json['nom'] as String,
      description: (json['description'] ?? '') as String,
      icone: json['icone'] as String?,
      couleur: json['couleur'] as String?,
      ordreAffichage: (json['ordre_affichage'] ?? 0) as int,
      estActif: json['est_actif'] == true || json['est_actif'] == 1,
      contenusCount: (json['contenus_count'] ?? 0) as int,
    );
  }

  @override
  List<Object?> get props => [id, nom];
}
