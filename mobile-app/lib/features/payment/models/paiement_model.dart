/// Paiement initié ou historique
class Paiement {
  final int id;
  final int montant;
  final String devise;
  final String methode; // orange_money, moov_money, wave
  final String statut; // en_attente, complete, echoue, rembourse
  final String reference;
  final String? instructionsUssd;
  final DateTime? datePaiement;
  final DateTime dateCreation;
  final DateTime? expiresAt;

  const Paiement({
    required this.id,
    required this.montant,
    this.devise = 'XOF',
    required this.methode,
    required this.statut,
    required this.reference,
    this.instructionsUssd,
    this.datePaiement,
    required this.dateCreation,
    this.expiresAt,
  });

  bool get isComplete => statut == 'complete';
  bool get isPending => statut == 'en_attente';
  bool get isFailed => statut == 'echoue';

  String get methodeLabel {
    switch (methode) {
      case 'orange_money':
        return 'Orange Money';
      case 'moov_money':
        return 'Moov Money';
      case 'wave':
        return 'Wave';
      default:
        return methode;
    }
  }

  String get methodeIcon {
    switch (methode) {
      case 'orange_money':
        return '🟠';
      case 'moov_money':
        return '🔵';
      case 'wave':
        return '🟣';
      default:
        return '💳';
    }
  }

  String get montantFormate {
    final str = montant.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return '${buffer.toString()} FCFA';
  }

  factory Paiement.fromJson(Map<String, dynamic> json) {
    return Paiement(
      id: (json['paiementId'] ?? json['id']) as int,
      montant: (json['montant'] as num).toInt(),
      devise: (json['devise'] ?? 'XOF') as String,
      methode: json['methode'] as String,
      statut: (json['statut'] ?? 'en_attente') as String,
      reference: (json['reference'] ?? '') as String,
      instructionsUssd: json['instructionsUssd'] as String?,
      datePaiement: json['datePaiement'] != null
          ? DateTime.tryParse(json['datePaiement'] as String)
          : null,
      dateCreation: json['dateCreation'] != null
          ? DateTime.parse(json['dateCreation'] as String)
          : DateTime.now(),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
    );
  }
}

/// Requête d'initiation de paiement
class PaymentRequest {
  final int abonnementId;
  final String methode;
  final String numeroTelephone;

  const PaymentRequest({
    required this.abonnementId,
    required this.methode,
    required this.numeroTelephone,
  });

  Map<String, dynamic> toJson() => {
        'abonnementId': abonnementId,
        'methode': methode,
        'numeroTelephone': numeroTelephone,
      };
}
