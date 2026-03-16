import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final int id;
  final String nom;
  final String prenom;
  final String telephone;
  final String? email;
  final String role;
  final String statutCompte;
  final int? enfantsCount;

  const UserModel({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.telephone,
    this.email,
    required this.role,
    required this.statutCompte,
    this.enfantsCount,
  });

  String get fullName => '$prenom $nom';

  bool get isAdmin => role == 'ADMIN';
  bool get isParent => role == 'PARENT';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      nom: json['nom'] as String,
      prenom: json['prenom'] as String,
      telephone: json['telephone'] as String,
      email: json['email'] as String?,
      role: json['role'] as String,
      statutCompte: (json['statutCompte'] ?? json['statut_compte'] ?? 'actif') as String,
      enfantsCount: json['enfants_count'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'telephone': telephone,
      'email': email,
      'role': role,
      'statutCompte': statutCompte,
    };
  }

  @override
  List<Object?> get props => [id, nom, prenom, telephone, email, role];
}
