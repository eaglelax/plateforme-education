import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/icon_mappings.dart';

class EnfantModel extends Equatable {
  final int id;
  final String nomPseudo;
  final String? avatar;
  final int age;
  final String codeConnexion;
  final String? modeConnexion;
  final int pointsXp;
  final int niveauGlobal;
  final bool? abonnementActif;
  final int? badgesCount;
  final String? statut;
  final EnfantAbonnement? abonnement;

  const EnfantModel({
    required this.id,
    required this.nomPseudo,
    this.avatar,
    required this.age,
    required this.codeConnexion,
    this.modeConnexion,
    required this.pointsXp,
    required this.niveauGlobal,
    this.abonnementActif,
    this.badgesCount,
    this.statut,
    this.abonnement,
  });

  /// IconData avatar based on age
  IconData get displayAvatarIcon => AppIcons.avatarForAge(age);

  factory EnfantModel.fromJson(Map<String, dynamic> json) {
    return EnfantModel(
      id: json['id'] as int,
      nomPseudo: json['nomPseudo'] as String,
      avatar: json['avatar'] as String?,
      age: json['age'] as int,
      codeConnexion: (json['codeConnexion'] ?? '') as String,
      modeConnexion: json['modeConnexion'] as String?,
      pointsXp: (json['pointsXp'] ?? 0) as int,
      niveauGlobal: (json['niveauGlobal'] ?? 1) as int,
      abonnementActif: json['abonnementActif'] != null
          ? (json['abonnementActif'] is bool
              ? json['abonnementActif'] as bool
              : (json['abonnementActif'] as int) != 0)
          : null,
      badgesCount: json['badgesCount'] as int?,
      statut: json['statut'] as String?,
      abonnement: json['abonnement'] != null
          ? EnfantAbonnement.fromJson(json['abonnement'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  List<Object?> get props => [id, nomPseudo, age, codeConnexion];
}

class EnfantAbonnement extends Equatable {
  final int id;
  final String type;
  final String dateFin;
  final String statut;

  const EnfantAbonnement({
    required this.id,
    required this.type,
    required this.dateFin,
    required this.statut,
  });

  bool get isActive => statut == 'actif' || statut == 'periode_grace';

  factory EnfantAbonnement.fromJson(Map<String, dynamic> json) {
    return EnfantAbonnement(
      id: json['id'] as int,
      type: json['type'] as String,
      dateFin: json['dateFin'] as String,
      statut: json['statut'] as String,
    );
  }

  @override
  List<Object?> get props => [id, type, statut];
}
