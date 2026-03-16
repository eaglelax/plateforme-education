import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/models/enfant_model.dart';
import '../../providers/parent_provider.dart';
import '../../../../core/utils/icon_mappings.dart';

/// Ecran gestion des enfants (onglet parent "Enfants")
class ChildrenManagementScreen extends ConsumerWidget {
  const ChildrenManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enfantsAsync = ref.watch(parentEnfantsProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Mes enfants'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(parentEnfantsProvider),
        child: enfantsAsync.when(
          data: (enfants) {
            if (enfants.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(AppIcons.family, size: 64, color: AppColors.bleuDoux),
                    const SizedBox(height: 16),
                    const Text(
                      'Aucun enfant ajouté',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Créez un profil pour commencer\nl\'aventure éducative !',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.texteSecondaire),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () => _showAddChildDialog(context, ref),
                      icon: const Icon(Icons.add),
                      label: const Text('Ajouter un enfant'),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: enfants.length + 1,
              itemBuilder: (context, index) {
                if (index == enfants.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: OutlinedButton.icon(
                      onPressed: () => _showAddChildDialog(context, ref),
                      icon: const Icon(Icons.add),
                      label: const Text('Ajouter un enfant'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(20),
                        side: const BorderSide(
                            color: AppColors.bleuDoux, width: 2),
                      ),
                    ),
                  );
                }
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ChildManagementCard(
                    enfant: enfants[index],
                    onViewStats: () => context.push(
                      '/parent/statistiques/${enfants[index].id}'
                      '?name=${Uri.encodeComponent(enfants[index].nomPseudo)}',
                    ),
                    onControls: () => context.push(
                      '/parent/controles/${enfants[index].id}'
                      '?name=${Uri.encodeComponent(enfants[index].nomPseudo)}',
                    ),
                    onEdit: () => _showEditChildDialog(
                        context, ref, enfants[index]),
                    onCredentials: () => _showCredentialsDialog(
                        context, ref, enfants[index]),
                    onDelete: () => _confirmDeleteChild(
                        context, ref, enfants[index]),
                  ),
                );
              },
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.bleuDoux),
          ),
          error: (_, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Erreur de chargement'),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => ref.invalidate(parentEnfantsProvider),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showAddChildDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final ageCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ajouter un enfant',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Pseudo de l\'enfant',
                hintText: 'Ex: Amadou',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ageCtrl,
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
                  final name = nameCtrl.text.trim();
                  final age = int.tryParse(ageCtrl.text.trim());
                  if (name.isEmpty || age == null || age < 4 || age > 12) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Nom requis et âge entre 4 et 12 ans')),
                    );
                    return;
                  }
                  try {
                    final dio = ref.read(parentDioProvider);
                    final enfant = await creerEnfant(dio,
                        nomPseudo: name, age: age);
                    ref.invalidate(parentEnfantsProvider);
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (context.mounted) {
                      _showCredentialsResult(context, enfant);
                    }
                  } on DioException catch (e) {
                    final msg = e.response?.data is Map
                        ? (e.response!.data['message'] ?? 'Erreur serveur')
                        : 'Erreur de connexion';
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(msg.toString())),
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

  void _showCredentialsResult(BuildContext context, EnfantModel enfant) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Profil créé !'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pseudo: ${enfant.nomPseudo}',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Code de connexion:',
                style: TextStyle(color: AppColors.texteSecondaire)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.beige,
                borderRadius: BorderRadius.circular(8),
              ),
              child: SelectableText(
                enfant.codeConnexion,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 2,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Notez ce code, il sera nécessaire pour la connexion de l\'enfant.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.texteSecondaire,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Compris'),
          ),
        ],
      ),
    );
  }

  void _showEditChildDialog(
      BuildContext context, WidgetRef ref, EnfantModel enfant) {
    final nameCtrl = TextEditingController(text: enfant.nomPseudo);
    final ageCtrl = TextEditingController(text: enfant.age.toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Modifier ${enfant.nomPseudo}',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Pseudo'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ageCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Âge'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  try {
                    final dio = ref.read(parentDioProvider);
                    await modifierEnfant(dio, enfant.id, {
                      'nomPseudo': nameCtrl.text.trim(),
                      'age': int.tryParse(ageCtrl.text.trim()) ?? enfant.age,
                    });
                    ref.invalidate(parentEnfantsProvider);
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Profil modifié !')),
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
                child: const Text('Enregistrer'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCredentialsDialog(
      BuildContext context, WidgetRef ref, EnfantModel enfant) async {
    try {
      final dio = ref.read(parentDioProvider);
      final creds = await getIdentifiantsEnfant(dio, enfant.id);

      if (!context.mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('Identifiants de ${enfant.nomPseudo}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _CredentialRow(
                  label: 'Code connexion',
                  value: creds['codeConnexion']?.toString() ?? enfant.codeConnexion),
              const SizedBox(height: 8),
              if (creds['motDePasse'] != null)
                _CredentialRow(
                    label: 'Mot de passe',
                    value: creds['motDePasse'].toString()),
              if (creds['pin'] != null) ...[
                const SizedBox(height: 8),
                _CredentialRow(
                    label: 'PIN', value: creds['pin'].toString()),
              ],
              const SizedBox(height: 8),
              _CredentialRow(
                label: 'Mode',
                value: (creds['modeConnexion'] ?? enfant.modeConnexion ?? 'mot_de_passe')
                    .toString(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Fermer'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  void _confirmDeleteChild(
      BuildContext context, WidgetRef ref, EnfantModel enfant) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Supprimer ${enfant.nomPseudo} ?'),
        content: const Text(
          'Cette action est irréversible. Toutes les données de progression seront perdues.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final dio = ref.read(parentDioProvider);
                await supprimerEnfant(dio, enfant.id);
                ref.invalidate(parentEnfantsProvider);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content:
                            Text('${enfant.nomPseudo} supprimé')),
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
            style: TextButton.styleFrom(
                foregroundColor: AppColors.rougeErreur),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}

class _ChildManagementCard extends StatelessWidget {
  final EnfantModel enfant;
  final VoidCallback onViewStats;
  final VoidCallback onControls;
  final VoidCallback onEdit;
  final VoidCallback onCredentials;
  final VoidCallback onDelete;

  const _ChildManagementCard({
    required this.enfant,
    required this.onViewStats,
    required this.onControls,
    required this.onEdit,
    required this.onCredentials,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          // Header
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
                      '${enfant.age} ans • ${enfant.pointsXp} XP • Niv. ${enfant.niveauGlobal}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.texteSecondaire,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      onEdit();
                    case 'credentials':
                      onCredentials();
                    case 'delete':
                      onDelete();
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 18),
                        SizedBox(width: 8),
                        Text('Modifier'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'credentials',
                    child: Row(
                      children: [
                        Icon(Icons.key, size: 18),
                        SizedBox(width: 8),
                        Text('Identifiants'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, size: 18,
                            color: AppColors.rougeErreur),
                        SizedBox(width: 8),
                        Text('Supprimer',
                            style: TextStyle(color: AppColors.rougeErreur)),
                      ],
                    ),
                  ),
                ],
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
                  child: const Text('Statistiques',
                      style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: onControls,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text('Contrôles',
                      style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CredentialRow extends StatelessWidget {
  final String label;
  final String value;

  const _CredentialRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(label,
              style: const TextStyle(color: AppColors.texteSecondaire)),
        ),
        Expanded(
          child: SelectableText(
            value,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
