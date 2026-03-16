import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/models/enfant_model.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../core/utils/icon_mappings.dart';
import '../../providers/parent_provider.dart';

/// Ecran 9: Tableau de bord parent (dynamique)
class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final enfantsAsync = ref.watch(parentEnfantsProvider);
    final abonnementsAsync = ref.watch(abonnementsProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Tableau de bord'),
        actions: [
          IconButton(
            icon: const Icon(AppIcons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(parentEnfantsProvider);
          ref.invalidate(abonnementsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Text(
                'Bonjour, ${user?.prenom ?? 'Parent'} !',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),

              // Subscription card
              abonnementsAsync.when(
                data: (abonnements) {
                  final actif = abonnements.where((a) => a.isActive).toList();
                  if (actif.isEmpty) {
                    return _NoSubscriptionCard(
                      onSubscribe: () => context.go('/parent/paiement'),
                    );
                  }
                  final abo = actif.first;
                  return _SubscriptionCard(
                    typeNom: abo.typeNom,
                    statut: abo.statut,
                    dateFin: abo.dateFinFormatee,
                    joursRestants: abo.joursRestants,
                    onRenew: () => context.go('/parent/paiement'),
                  );
                },
                loading: () => _SubscriptionCardSkeleton(),
                error: (_, _) => _NoSubscriptionCard(
                  onSubscribe: () => context.go('/parent/paiement'),
                ),
              ),
              const SizedBox(height: 20),

              // Children section
              const Text(
                'Mes enfants :',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textePrincipal,
                ),
              ),
              const SizedBox(height: 12),

              enfantsAsync.when(
                data: (enfants) {
                  if (enfants.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          'Aucun enfant ajouté.\nCommencez par créer un profil !',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.texteSecondaire),
                        ),
                      ),
                    );
                  }
                  return Column(
                    children: enfants
                        .map((enfant) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ChildCard(
                                enfant: enfant,
                                onViewStats: () => context.push(
                                  '/parent/statistiques/${enfant.id}'
                                  '?name=${Uri.encodeComponent(enfant.nomPseudo)}',
                                ),
                                onManageControls: () => context.push(
                                  '/parent/controles/${enfant.id}'
                                  '?name=${Uri.encodeComponent(enfant.nomPseudo)}',
                                ),
                              ),
                            ))
                        .toList(),
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(
                        color: AppColors.bleuDoux),
                  ),
                ),
                error: (error, _) => Center(
                  child: Column(
                    children: [
                      const Text('Erreur de chargement'),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: () =>
                            ref.invalidate(parentEnfantsProvider),
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Add child button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _showAddChildDialog(context, ref),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(20),
                    side: const BorderSide(
                      color: AppColors.bleuDoux,
                      width: 2,
                    ),
                  ),
                  child: const Text('+ Ajouter un enfant'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddChildDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final ageController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ajouter un enfant',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Pseudo de l\'enfant',
                hintText: 'Ex: Amadou',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Âge',
                hintText: 'Ex: 8',
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final name = nameController.text.trim();
                  final age = int.tryParse(ageController.text.trim());
                  if (name.isEmpty || age == null || age < 3 || age > 18) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Veuillez entrer un nom et un âge valide (3-18)'),
                      ),
                    );
                    return;
                  }
                  try {
                    final dio = ref.read(parentDioProvider);
                    final enfant = await creerEnfant(
                      dio,
                      nomPseudo: name,
                      age: age,
                    );
                    ref.invalidate(parentEnfantsProvider);
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            '${enfant.nomPseudo} créé ! Code: ${enfant.codeConnexion}',
                          ),
                          duration: const Duration(seconds: 5),
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Erreur: $e')),
                      );
                    }
                  }
                },
                child: const Text('Créer le profil'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =========================================
// Subscription cards
// =========================================

class _SubscriptionCard extends StatelessWidget {
  final String typeNom;
  final String statut;
  final String dateFin;
  final int joursRestants;
  final VoidCallback onRenew;

  const _SubscriptionCard({
    required this.typeNom,
    required this.statut,
    required this.dateFin,
    required this.joursRestants,
    required this.onRenew,
  });

  @override
  Widget build(BuildContext context) {
    final isWarning = joursRestants <= 7;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.beige,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Abonnement $typeNom',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.texteSecondaire,
                ),
              ),
              Row(
                children: [
                  Icon(
                    statut == 'actif' ? AppIcons.check : AppIcons.warning,
                    size: 14,
                    color: statut == 'actif' ? AppColors.vertNaturel : AppColors.ocre,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    statut == 'actif' ? 'Actif' : 'Bientôt expiré',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: statut == 'actif'
                          ? AppColors.vertNaturel
                          : AppColors.ocre,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              isWarning
                  ? 'Expire dans $joursRestants jour${joursRestants > 1 ? 's' : ''} ($dateFin)'
                  : 'Expire le $dateFin',
              style: TextStyle(
                fontSize: 13,
                color: isWarning ? AppColors.ocre : AppColors.texteSecondaire,
                fontWeight: isWarning ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
          if (isWarning) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onRenew,
                child: const Text('Renouveler maintenant'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NoSubscriptionCard extends StatelessWidget {
  final VoidCallback onSubscribe;

  const _NoSubscriptionCard({required this.onSubscribe});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.beige,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.ocre, width: 1.5),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(AppIcons.phone, size: 24, color: AppColors.ocre),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Aucun abonnement actif',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ocre,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Souscrivez pour accéder à tous les contenus éducatifs.',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.texteSecondaire,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onSubscribe,
              child: const Text('Souscrire un abonnement'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SubscriptionCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.beige,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: CircularProgressIndicator(color: AppColors.bleuDoux),
      ),
    );
  }
}

// =========================================
// Child card
// =========================================

class _ChildCard extends StatelessWidget {
  final EnfantModel enfant;
  final VoidCallback onViewStats;
  final VoidCallback onManageControls;

  const _ChildCard({
    required this.enfant,
    required this.onViewStats,
    required this.onManageControls,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(enfant.displayAvatarIcon, size: 40, color: AppColors.bleuDoux),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      enfant.nomPseudo,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      '${enfant.age} ans • Niveau ${enfant.niveauGlobal}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.texteSecondaire,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: enfant.abonnement?.isActive == true
                      ? AppColors.vertNaturel.withValues(alpha: 0.1)
                      : AppColors.grisClair,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  enfant.abonnement?.isActive == true
                      ? 'Actif'
                      : 'Inactif',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: enfant.abonnement?.isActive == true
                        ? AppColors.vertNaturel
                        : AppColors.texteSecondaire,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Stats row
          Row(
            children: [
              _StatChip(
                icon: AppIcons.star,
                label: '${enfant.pointsXp} XP',
              ),
              const SizedBox(width: 12),
              _StatChip(
                icon: AppIcons.trophy,
                label: '${enfant.badgesCount ?? 0} badges',
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onViewStats,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(AppIcons.chart, size: 14),
                      SizedBox(width: 4),
                      Text('Statistiques', style: TextStyle(fontSize: 13)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: onManageControls,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(AppIcons.lock, size: 14),
                      SizedBox(width: 4),
                      Text('Controles', style: TextStyle(fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.beige,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.jauneSoleil),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
