/// Type d'abonnement (plans disponibles)
class AbonnementType {
  final int id;
  final String nom;
  final String? description;
  final int prix;
  final String devise;
  final String duree; // MENSUEL, TRIMESTRIEL, ANNUEL
  final int nombreAppareilsMax;
  final bool telechargementAutorise;
  final bool contenuPremium;

  const AbonnementType({
    required this.id,
    required this.nom,
    this.description,
    required this.prix,
    this.devise = 'XOF',
    required this.duree,
    this.nombreAppareilsMax = 3,
    this.telechargementAutorise = true,
    this.contenuPremium = false,
  });

  String get prixFormate => '${_formatNumber(prix)} FCFA';

  String get dureeLabel {
    switch (duree) {
      case 'MENSUEL':
        return '/mois';
      case 'TRIMESTRIEL':
        return '/trimestre';
      case 'ANNUEL':
        return '/an';
      default:
        return '';
    }
  }

  static String _formatNumber(int n) {
    final str = n.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  factory AbonnementType.fromJson(Map<String, dynamic> json) {
    return AbonnementType(
      id: json['id'] as int,
      nom: json['nom'] as String,
      description: json['description'] as String?,
      prix: _parsePrice(json['prix']),
      devise: (json['devise'] ?? 'XOF') as String,
      duree: json['duree'] as String,
      nombreAppareilsMax: (json['nombre_appareils_max'] ?? 3) as int,
      telechargementAutorise: _parseBool(json['telechargement_autorise'] ?? true),
      contenuPremium: _parseBool(json['contenu_premium'] ?? false),
    );
  }

  static int _parsePrice(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return double.tryParse(value)?.toInt() ?? 0;
    return 0;
  }

  static bool _parseBool(dynamic value) {
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) return value == '1' || value == 'true';
    return false;
  }
}

/// Abonnement actif/historique
class Abonnement {
  final int id;
  final DateTime dateDebut;
  final DateTime dateFin;
  final String statut; // actif, expire, annule, suspendu, periode_grace
  final bool renouvellementAuto;
  final String typeNom;
  final int typePrix;
  final String typeDuree;

  const Abonnement({
    required this.id,
    required this.dateDebut,
    required this.dateFin,
    required this.statut,
    this.renouvellementAuto = false,
    required this.typeNom,
    required this.typePrix,
    required this.typeDuree,
  });

  bool get isActive => statut == 'actif' || statut == 'periode_grace';

  int get joursRestants {
    final diff = dateFin.difference(DateTime.now()).inDays;
    return diff > 0 ? diff : 0;
  }

  String get dateFinFormatee {
    return '${dateFin.day.toString().padLeft(2, '0')}/${dateFin.month.toString().padLeft(2, '0')}/${dateFin.year}';
  }

  factory Abonnement.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as Map<String, dynamic>?;
    return Abonnement(
      id: json['id'] as int,
      dateDebut: DateTime.parse(json['dateDebut'] as String),
      dateFin: DateTime.parse(json['dateFin'] as String),
      statut: json['statut'] as String,
      renouvellementAuto: _parseBool(json['renouvellementAuto'] ?? false),
      typeNom: (type?['nom'] ?? json['type_nom'] ?? '') as String,
      typePrix: _parsePrice(type?['prix'] ?? json['type_prix'] ?? 0),
      typeDuree: (type?['duree'] ?? json['type_duree'] ?? '') as String,
    );
  }

  static bool _parseBool(dynamic value) {
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) return value == '1' || value == 'true';
    return false;
  }

  static int _parsePrice(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return double.tryParse(value)?.toInt() ?? 0;
    return 0;
  }
}
