/// Paramètres de contrôle parental pour un enfant
class ParametresParentaux {
  final int tempsMaxQuotidien; // minutes (0-720)
  final String heureDebut; // HH:MM:SS
  final String heureFin;
  final List<String> joursAutorises;
  final bool modeKiosqueActif;
  final bool pinParentalConfigure;
  final bool bloquerNavigateur;
  final bool bloquerTelechargements;
  final bool bloquerParametres;
  final bool filtrageContenuActif;
  final String niveauFiltrage; // strict, modere, permissif
  final bool notificationsActivite;
  final bool notificationsTempsEcoule;

  const ParametresParentaux({
    this.tempsMaxQuotidien = 60,
    this.heureDebut = '08:00:00',
    this.heureFin = '20:00:00',
    this.joursAutorises = const [
      'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
    ],
    this.modeKiosqueActif = false,
    this.pinParentalConfigure = false,
    this.bloquerNavigateur = false,
    this.bloquerTelechargements = false,
    this.bloquerParametres = false,
    this.filtrageContenuActif = true,
    this.niveauFiltrage = 'modere',
    this.notificationsActivite = true,
    this.notificationsTempsEcoule = true,
  });

  String get heureDebutFormatee => heureDebut.substring(0, 5);
  String get heureFinFormatee => heureFin.substring(0, 5);

  ParametresParentaux copyWith({
    int? tempsMaxQuotidien,
    String? heureDebut,
    String? heureFin,
    List<String>? joursAutorises,
    bool? modeKiosqueActif,
    bool? bloquerNavigateur,
    bool? bloquerTelechargements,
    bool? bloquerParametres,
    bool? filtrageContenuActif,
    String? niveauFiltrage,
    bool? notificationsActivite,
    bool? notificationsTempsEcoule,
  }) {
    return ParametresParentaux(
      tempsMaxQuotidien: tempsMaxQuotidien ?? this.tempsMaxQuotidien,
      heureDebut: heureDebut ?? this.heureDebut,
      heureFin: heureFin ?? this.heureFin,
      joursAutorises: joursAutorises ?? this.joursAutorises,
      modeKiosqueActif: modeKiosqueActif ?? this.modeKiosqueActif,
      pinParentalConfigure: pinParentalConfigure,
      bloquerNavigateur: bloquerNavigateur ?? this.bloquerNavigateur,
      bloquerTelechargements: bloquerTelechargements ?? this.bloquerTelechargements,
      bloquerParametres: bloquerParametres ?? this.bloquerParametres,
      filtrageContenuActif: filtrageContenuActif ?? this.filtrageContenuActif,
      niveauFiltrage: niveauFiltrage ?? this.niveauFiltrage,
      notificationsActivite: notificationsActivite ?? this.notificationsActivite,
      notificationsTempsEcoule: notificationsTempsEcoule ?? this.notificationsTempsEcoule,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tempsMaxQuotidien': tempsMaxQuotidien,
      'heureDebut': heureDebut,
      'heureFin': heureFin,
      'joursAutorises': joursAutorises,
      'modeKiosqueActif': modeKiosqueActif,
      'bloquerNavigateur': bloquerNavigateur,
      'bloquerTelechargements': bloquerTelechargements,
      'bloquerParametres': bloquerParametres,
      'filtrageContenuActif': filtrageContenuActif,
      'niveauFiltrage': niveauFiltrage,
      'notificationsActivite': notificationsActivite,
      'notificationsTempsEcoule': notificationsTempsEcoule,
    };
  }

  factory ParametresParentaux.fromJson(Map<String, dynamic> json) {
    return ParametresParentaux(
      tempsMaxQuotidien: (json['tempsMaxQuotidien'] ?? 60) as int,
      heureDebut: (json['heureDebut'] ?? '08:00:00') as String,
      heureFin: (json['heureFin'] ?? '20:00:00') as String,
      joursAutorises: json['joursAutorises'] != null
          ? List<String>.from(json['joursAutorises'] as List)
          : const ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
      modeKiosqueActif: _parseBool(json['modeKiosqueActif'] ?? false),
      pinParentalConfigure: _parseBool(json['pinParentalConfigure'] ?? false),
      bloquerNavigateur: _parseBool(json['bloquerNavigateur'] ?? false),
      bloquerTelechargements: _parseBool(json['bloquerTelechargements'] ?? false),
      bloquerParametres: _parseBool(json['bloquerParametres'] ?? false),
      filtrageContenuActif: _parseBool(json['filtrageContenuActif'] ?? true),
      niveauFiltrage: (json['niveauFiltrage'] ?? 'modere') as String,
      notificationsActivite: _parseBool(json['notificationsActivite'] ?? true),
      notificationsTempsEcoule: _parseBool(json['notificationsTempsEcoule'] ?? true),
    );
  }

  static bool _parseBool(dynamic value) {
    if (value is bool) return value;
    if (value is int) return value != 0;
    if (value is String) return value == '1' || value == 'true';
    return false;
  }
}
