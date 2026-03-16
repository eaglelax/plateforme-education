import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_card.dart';
import '../../parent/providers/parent_provider.dart';

/// Ecran 13: Confirmation paiement (dynamique avec polling)
class PaymentConfirmationScreen extends ConsumerStatefulWidget {
  final int montant;
  final String methode;
  final String reference;
  final String dateFin;
  final int? paiementId;

  const PaymentConfirmationScreen({
    super.key,
    required this.montant,
    required this.methode,
    required this.reference,
    required this.dateFin,
    this.paiementId,
  });

  @override
  ConsumerState<PaymentConfirmationScreen> createState() =>
      _PaymentConfirmationScreenState();
}

class _PaymentConfirmationScreenState
    extends ConsumerState<PaymentConfirmationScreen> {
  String _status = 'en_attente';
  Timer? _pollTimer;
  int _pollCount = 0;

  @override
  void initState() {
    super.initState();
    if (widget.paiementId != null) {
      _startPolling();
    } else {
      _status = 'complete';
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (_pollCount >= 24) {
        // 2 minutes max
        _pollTimer?.cancel();
        return;
      }
      _pollCount++;
      try {
        final dio = ref.read(parentDioProvider);
        final paiement =
            await verifierPaiement(dio, widget.paiementId!);
        if (mounted) {
          setState(() => _status = paiement.statut);
        }
        if (paiement.isComplete || paiement.isFailed) {
          _pollTimer?.cancel();
          if (paiement.isComplete) {
            ref.invalidate(abonnementsProvider);
          }
        }
      } catch (_) {
        // Continue polling
      }
    });
  }

  String get _methodeLabel {
    switch (widget.methode) {
      case 'orange_money':
        return 'Orange Money';
      case 'moov_money':
        return 'Moov Money';
      case 'wave':
        return 'Wave';
      default:
        return widget.methode;
    }
  }

  String get _montantFormate {
    final str = widget.montant.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return '${buffer.toString()} FCFA';
  }

  @override
  Widget build(BuildContext context) {
    final isComplete = _status == 'complete';
    final isFailed = _status == 'echoue';
    final isPending = _status == 'en_attente';

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Status icon
                if (isComplete)
                  Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      color: AppColors.vertNaturel,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(Icons.check,
                          size: 40, color: AppColors.blanc),
                    ),
                  )
                else if (isFailed)
                  Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      color: AppColors.rougeErreur,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(Icons.close,
                          size: 40, color: AppColors.blanc),
                    ),
                  )
                else
                  const SizedBox(
                    width: 80,
                    height: 80,
                    child: CircularProgressIndicator(
                      color: AppColors.bleuDoux,
                      strokeWidth: 6,
                    ),
                  ),
                const SizedBox(height: 20),

                // Status text
                Text(
                  isComplete
                      ? 'Paiement reussi !'
                      : isFailed
                          ? 'Paiement echoue'
                          : 'En attente de confirmation...',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: isComplete
                        ? AppColors.vertNaturel
                        : isFailed
                            ? AppColors.rougeErreur
                            : AppColors.bleuDoux,
                  ),
                ),

                if (isPending) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Confirmez le paiement sur votre telephone',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.texteSecondaire,
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Receipt card
                AppCard.beige(
                  child: Column(
                    children: [
                      _ReceiptRow(label: 'Montant', value: _montantFormate),
                      const SizedBox(height: 8),
                      _ReceiptRow(label: 'Mode', value: _methodeLabel),
                      const SizedBox(height: 8),
                      _ReceiptRow(
                          label: 'Reference', value: widget.reference),
                      const SizedBox(height: 8),
                      _ReceiptRow(
                        label: 'Statut',
                        value: isComplete
                            ? 'Complete'
                            : isFailed
                                ? 'Echoue'
                                : 'En attente',
                      ),
                      if (isComplete) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.only(top: 12),
                          decoration: const BoxDecoration(
                            border: Border(
                              top: BorderSide(
                                color: AppColors.grisClair,
                                width: 1,
                              ),
                            ),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'Abonnement actif jusqu\'au :',
                                style: TextStyle(
                                  color: AppColors.texteSecondaire,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.dateFin,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.bleuDoux,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                if (isFailed)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.pop(),
                      child: const Text('Reessayer'),
                    ),
                  ),

                if (isComplete || isFailed) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => context.go('/parent/dashboard'),
                      child: const Text('Retour au tableau de bord'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;

  const _ReceiptRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.texteSecondaire,
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}
