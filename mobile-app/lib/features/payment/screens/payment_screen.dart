import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../parent/models/abonnement_model.dart';
import '../../parent/providers/parent_provider.dart';
import '../models/paiement_model.dart';

/// Ecran 12: Paiement Mobile Money (dynamique)
class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  int _selectedPlanIndex = 0;
  int _selectedPayment = 0; // 0: Orange, 1: Moov, 2: Wave
  final _phoneController = TextEditingController();
  bool _processing = false;

  static const _paymentMethods = ['orange_money', 'moov_money', 'wave'];

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pay(List<AbonnementType> plans) async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entrez votre numéro Mobile Money')),
      );
      return;
    }

    setState(() => _processing = true);
    try {
      final dio = ref.read(parentDioProvider);
      final plan = plans[_selectedPlanIndex];

      // First, get or create a subscription for the first child
      final enfants = await ref.read(parentEnfantsProvider.future);
      if (enfants.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Veuillez d\'abord ajouter un enfant')),
          );
        }
        setState(() => _processing = false);
        return;
      }

      // Create subscription
      final abonnement = await creerAbonnement(
          dio, enfants.first.id, plan.id);

      // Initiate payment
      final paiement = await initierPaiement(
        dio,
        PaymentRequest(
          abonnementId: abonnement.id,
          methode: _paymentMethods[_selectedPayment],
          numeroTelephone: phone,
        ),
      );

      ref.invalidate(abonnementsProvider);

      if (mounted) {
        context.push(
          '/parent/paiement/confirmation'
          '?montant=${plan.prix}'
          '&methode=${_paymentMethods[_selectedPayment]}'
          '&reference=${paiement.reference}'
          '&dateFin=${abonnement.dateFinFormatee}'
          '&paiementId=${paiement.id}',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(abonnementTypesProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(title: const Text('Paiement')),
      body: plansAsync.when(
        data: (plans) {
          if (plans.isEmpty) {
            return const Center(
              child: Text('Aucun abonnement disponible'),
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choisir un abonnement :',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textePrincipal,
                  ),
                ),
                const SizedBox(height: 12),

                // Plans from API
                ...plans.asMap().entries.map((entry) {
                  final i = entry.key;
                  final plan = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _PlanCard(
                      isSelected: _selectedPlanIndex == i,
                      name: plan.nom,
                      price: plan.prixFormate,
                      period: plan.dureeLabel,
                      badge: plan.contenuPremium ? 'Premium' : null,
                      features: [
                        'Accès illimité',
                        'Jusqu\'à ${plan.nombreAppareilsMax} appareils',
                        if (plan.telechargementAutorise) 'Contenu téléchargeable',
                        if (plan.contenuPremium) 'Contenu premium inclus',
                      ],
                      onTap: () =>
                          setState(() => _selectedPlanIndex = i),
                    ),
                  );
                }),
                const SizedBox(height: 8),

                const Text(
                  'Mode de paiement :',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textePrincipal,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _PaymentMethod(
                      logo: Icons.circle,
                      logoColor: Colors.orange,
                      name: 'ORANGE\nMONEY',
                      isSelected: _selectedPayment == 0,
                      onTap: () => setState(() => _selectedPayment = 0),
                    ),
                    const SizedBox(width: 12),
                    _PaymentMethod(
                      logo: Icons.circle,
                      logoColor: Colors.blue,
                      name: 'MOOV\nMONEY',
                      isSelected: _selectedPayment == 1,
                      onTap: () => setState(() => _selectedPayment = 1),
                    ),
                    const SizedBox(width: 12),
                    _PaymentMethod(
                      logo: Icons.circle,
                      logoColor: Colors.purple,
                      name: 'WAVE',
                      isSelected: _selectedPayment == 2,
                      onTap: () => setState(() => _selectedPayment = 2),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Numero Mobile Money',
                    hintText: '+226 76 XX XX XX',
                    prefixIcon: Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        _processing ? null : () => _pay(plans),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.vertNaturel,
                    ),
                    child: _processing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.blanc,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'Payer ${plans[_selectedPlanIndex].prixFormate}',
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                const Center(
                  child: Text(
                    'Paiement securise',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.texteSecondaire,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.bleuDoux),
        ),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Impossible de charger les abonnements'),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => ref.invalidate(abonnementTypesProvider),
                child: const Text('Reessayer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final bool isSelected;
  final String name;
  final String price;
  final String period;
  final String? badge;
  final List<String> features;
  final VoidCallback onTap;

  const _PlanCard({
    required this.isSelected,
    required this.name,
    required this.price,
    required this.period,
    this.badge,
    required this.features,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.bleuDoux.withValues(alpha: 0.03)
                  : AppColors.blanc,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color:
                    isSelected ? AppColors.bleuDoux : AppColors.grisClair,
                width: 2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.texteSecondaire,
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: price,
                        style: const TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textePrincipal,
                        ),
                      ),
                      TextSpan(
                        text: ' $period',
                        style: const TextStyle(
                          fontFamily: 'Nunito',
                          fontSize: 14,
                          color: AppColors.texteSecondaire,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                ...features.map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        const Text(
                          '✓ ',
                          style: TextStyle(
                            color: AppColors.vertNaturel,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            f,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.texteSecondaire,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (badge != null)
            Positioned(
              top: -10,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.ocre,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.blanc,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PaymentMethod extends StatelessWidget {
  final IconData logo;
  final Color logoColor;
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentMethod({
    required this.logo,
    required this.logoColor,
    required this.name,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.bleuDoux.withValues(alpha: 0.05)
                : AppColors.blanc,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color:
                  isSelected ? AppColors.bleuDoux : AppColors.grisClair,
              width: 2,
            ),
          ),
          child: Column(
            children: [
              Icon(logo, size: 28, color: logoColor),
              const SizedBox(height: 4),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textePrincipal,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
