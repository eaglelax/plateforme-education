/// Résumé statistiques d'un enfant
class StatistiquesEnfant {
  final int contenusCompletes;
  final int contenusUniques;
  final int tempsTotalMinutes;
  final int pointsGagnes;
  final double scoreMoyen;
  final List<StatistiquesDomaine> topDomaines;
  final List<ActiviteJour> activiteParJour;

  const StatistiquesEnfant({
    this.contenusCompletes = 0,
    this.contenusUniques = 0,
    this.tempsTotalMinutes = 0,
    this.pointsGagnes = 0,
    this.scoreMoyen = 0,
    this.topDomaines = const [],
    this.activiteParJour = const [],
  });

  String get tempsFormate {
    if (tempsTotalMinutes < 60) return '${tempsTotalMinutes}min';
    final h = tempsTotalMinutes ~/ 60;
    final m = tempsTotalMinutes % 60;
    return m > 0 ? '${h}h${m.toString().padLeft(2, '0')}' : '${h}h';
  }

  factory StatistiquesEnfant.fromJson(Map<String, dynamic> json) {
    final stats = json['statistiques'] as Map<String, dynamic>?;
    return StatistiquesEnfant(
      contenusCompletes: ((stats?['contenusCompletes'] ?? json['contenusCompletes'] ?? 0) as num).toInt(),
      contenusUniques: ((stats?['contenusUniques'] ?? json['contenusUniques'] ?? 0) as num).toInt(),
      tempsTotalMinutes: ((stats?['tempsTotalMinutes'] ?? json['tempsTotalMinutes'] ?? 0) as num).toInt(),
      pointsGagnes: ((stats?['pointsGagnes'] ?? json['pointsGagnes'] ?? 0) as num).toInt(),
      scoreMoyen: ((stats?['scoreMoyen'] ?? json['scoreMoyen'] ?? 0) as num).toDouble(),
      topDomaines: (json['topDomaines'] as List<dynamic>?)
              ?.map((e) => StatistiquesDomaine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      activiteParJour: (json['activiteParJour'] as List<dynamic>?)
              ?.map((e) => ActiviteJour.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Statistiques par domaine
class StatistiquesDomaine {
  final String nom;
  final String? icone;
  final String? couleur;
  final int contenusTotal;
  final int contenusCompletes;
  final int pointsTotaux;
  final double progressionMoyenne;
  final int pourcentageComplete;

  const StatistiquesDomaine({
    required this.nom,
    this.icone,
    this.couleur,
    this.contenusTotal = 0,
    this.contenusCompletes = 0,
    this.pointsTotaux = 0,
    this.progressionMoyenne = 0,
    this.pourcentageComplete = 0,
  });

  String get displayIcon {
    if (icone != null && icone!.isNotEmpty) return icone!;
    final lower = nom.toLowerCase();
    if (lower.contains('lecture') || lower.contains('langue')) return '📚';
    if (lower.contains('histoire') || lower.contains('géo')) return '🗺️';
    if (lower.contains('science')) return '🔬';
    if (lower.contains('logique') || lower.contains('math')) return '🧮';
    if (lower.contains('art') || lower.contains('créa')) return '🎨';
    if (lower.contains('civisme') || lower.contains('culture')) return '🌍';
    return '📖';
  }

  factory StatistiquesDomaine.fromJson(Map<String, dynamic> json) {
    return StatistiquesDomaine(
      nom: (json['nom'] ?? '') as String,
      icone: json['icone'] as String?,
      couleur: json['couleur'] as String?,
      contenusTotal: ((json['contenus_total'] ?? json['contenusTotal'] ?? 0) as num).toInt(),
      contenusCompletes: ((json['contenus_completes'] ?? json['contenusCompletes'] ?? 0) as num).toInt(),
      pointsTotaux: ((json['points_totaux'] ?? json['pointsTotaux'] ?? json['points'] ?? 0) as num).toInt(),
      progressionMoyenne: ((json['progression_moyenne'] ?? json['progressionMoyenne'] ?? 0) as num).toDouble(),
      pourcentageComplete: ((json['pourcentageComplete'] ?? 0) as num).toInt(),
    );
  }
}

/// Activité par jour (pour graphiques)
class ActiviteJour {
  final String jour; // yyyy-MM-dd
  final int minutes;
  final int acces;

  const ActiviteJour({
    required this.jour,
    this.minutes = 0,
    this.acces = 0,
  });

  String get jourCourt {
    try {
      final date = DateTime.parse(jour);
      const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return jours[date.weekday - 1];
    } catch (_) {
      return jour;
    }
  }

  factory ActiviteJour.fromJson(Map<String, dynamic> json) {
    return ActiviteJour(
      jour: json['jour'] as String,
      minutes: ((json['minutes'] ?? 0) as num).toInt(),
      acces: ((json['acces'] ?? 0) as num).toInt(),
    );
  }
}

/// Données temps d'écran
class TempsEcranData {
  final int totalMinutes;
  final int moyenneQuotidienne;
  final int limiteQuotidienne;
  final List<ActiviteJour> parJour;

  const TempsEcranData({
    this.totalMinutes = 0,
    this.moyenneQuotidienne = 0,
    this.limiteQuotidienne = 60,
    this.parJour = const [],
  });

  factory TempsEcranData.fromJson(Map<String, dynamic> json) {
    return TempsEcranData(
      totalMinutes: ((json['totalMinutes'] ?? 0) as num).toInt(),
      moyenneQuotidienne: ((json['moyenneQuotidienne'] ?? 0) as num).toInt(),
      limiteQuotidienne: ((json['limiteQuotidienne'] ?? 60) as num).toInt(),
      parJour: (json['parJour'] as List<dynamic>?)
              ?.map((e) => ActiviteJour.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Progression détaillée par domaine
class ProgressionEnfant {
  final int pointsXpTotal;
  final String niveauGlobal;
  final List<StatistiquesDomaine> parDomaine;

  const ProgressionEnfant({
    this.pointsXpTotal = 0,
    this.niveauGlobal = '',
    this.parDomaine = const [],
  });

  factory ProgressionEnfant.fromJson(Map<String, dynamic> json) {
    return ProgressionEnfant(
      pointsXpTotal: ((json['pointsXpTotal'] ?? 0) as num).toInt(),
      niveauGlobal: (json['niveauGlobal'] ?? '') as String,
      parDomaine: (json['parDomaine'] as List<dynamic>?)
              ?.map((e) => StatistiquesDomaine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
