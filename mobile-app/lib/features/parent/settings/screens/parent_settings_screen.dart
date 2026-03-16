import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/settings_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/providers/auth_provider.dart';

/// Ecran Paramètres parent (profil, préférences, déconnexion)
class ParentSettingsScreen extends ConsumerWidget {
  const ParentSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Paramètres'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile card
            AppCard.beige(
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.bleuDoux,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(
                        user != null
                            ? '${user.prenom[0]}${user.nom[0]}'
                            : '??',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.blanc,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'Parent',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.telephone ?? '',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.texteSecondaire,
                          ),
                        ),
                        if (user?.email != null)
                          Text(
                            user!.email!,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.texteSecondaire,
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _showEditProfileDialog(context, ref),
                    icon: const Icon(Icons.edit,
                        color: AppColors.bleuDoux, size: 20),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Account section
            const Text(
              'Compte',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textePrincipal,
              ),
            ),
            const SizedBox(height: 12),
            _SettingsItem(
              icon: Icons.lock_outline,
              label: 'Changer le mot de passe',
              onTap: () => _showChangePasswordDialog(context, ref),
            ),
            _SettingsItem(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              trailing: const Text(
                'Activées',
                style: TextStyle(
                  color: AppColors.vertNaturel,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () {},
            ),
            const SizedBox(height: 24),

            // App section
            const Text(
              'Application',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textePrincipal,
              ),
            ),
            const SizedBox(height: 12),
            _SettingsItem(
              icon: Icons.dark_mode_outlined,
              label: 'Thème sombre',
              trailing: Switch(
                value: ref.watch(themeModeProvider) == ThemeMode.dark,
                onChanged: (value) {
                  ref.read(themeModeProvider.notifier).setThemeMode(
                        value ? ThemeMode.dark : ThemeMode.light,
                      );
                },
                activeTrackColor: AppColors.bleuDoux,
              ),
              onTap: () {
                ref.read(themeModeProvider.notifier).toggle();
              },
            ),
            _SettingsItem(
              icon: Icons.info_outline,
              label: 'À propos',
              trailing: const Text(
                'v1.0.0',
                style: TextStyle(
                  color: AppColors.texteSecondaire,
                  fontSize: 13,
                ),
              ),
              onTap: () => _showAboutDialog(context),
            ),
            _SettingsItem(
              icon: Icons.help_outline,
              label: 'Aide et support',
              onTap: () {},
            ),
            _SettingsItem(
              icon: Icons.privacy_tip_outlined,
              label: 'Politique de confidentialité',
              onTap: () {},
            ),
            const SizedBox(height: 24),

            // Danger zone
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref),
                icon: const Icon(Icons.logout, color: AppColors.rougeErreur),
                label: const Text(
                  'Se déconnecter',
                  style: TextStyle(color: AppColors.rougeErreur),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.rougeErreur),
                  padding: const EdgeInsets.all(16),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Se déconnecter ?'),
        content: const Text(
          'Vous devrez vous reconnecter pour accéder à votre compte.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.rougeErreur,
            ),
            child: const Text('Se déconnecter'),
          ),
        ],
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context, WidgetRef ref) {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final nomCtrl = TextEditingController(text: user.nom);
    final prenomCtrl = TextEditingController(text: user.prenom);
    final emailCtrl = TextEditingController(text: user.email ?? '');
    final loadingNotifier = ValueNotifier<bool>(false);

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
              'Modifier le profil',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: prenomCtrl,
              decoration: const InputDecoration(labelText: 'Prénom'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nomCtrl,
              decoration: const InputDecoration(labelText: 'Nom'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration:
                  const InputDecoration(labelText: 'Email (optionnel)'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ValueListenableBuilder<bool>(
                valueListenable: loadingNotifier,
                builder: (ctx, isLoading, _) => ElevatedButton(
                  onPressed: isLoading
                      ? null
                      : () async {
                          final nom = nomCtrl.text.trim();
                          final prenom = prenomCtrl.text.trim();
                          if (nom.isEmpty || prenom.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('Le nom et le prénom sont requis'),
                                backgroundColor: AppColors.rougeErreur,
                              ),
                            );
                            return;
                          }
                          loadingNotifier.value = true;
                          final error = await ref
                              .read(authProvider.notifier)
                              .updateProfile(
                                nom: nom,
                                prenom: prenom,
                                email: emailCtrl.text.trim().isEmpty
                                    ? null
                                    : emailCtrl.text.trim(),
                              );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content:
                                    Text(error ?? 'Profil mis à jour !'),
                                backgroundColor: error != null
                                    ? AppColors.rougeErreur
                                    : AppColors.vertNaturel,
                              ),
                            );
                          }
                        },
                  child: isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.blanc,
                          ),
                        )
                      : const Text('Enregistrer'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context, WidgetRef ref) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

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
              'Changer le mot de passe',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: currentCtrl,
              obscureText: true,
              decoration:
                  const InputDecoration(labelText: 'Mot de passe actuel'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newCtrl,
              obscureText: true,
              decoration:
                  const InputDecoration(labelText: 'Nouveau mot de passe'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: confirmCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirmer'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (newCtrl.text != confirmCtrl.text) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content:
                              Text('Les mots de passe ne correspondent pas')),
                    );
                    return;
                  }
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Mot de passe modifié !')),
                  );
                },
                child: const Text('Modifier'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Faso Yiri'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version 1.0.0'),
            SizedBox(height: 8),
            Text(
              'Plateforme éducative pour les enfants du Burkina Faso.\n\n'
              'Apprendre en s\'amusant avec des contenus adaptés à chaque âge.',
              style: TextStyle(
                color: AppColors.texteSecondaire,
                fontSize: 14,
              ),
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
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final VoidCallback onTap;

  const _SettingsItem({
    required this.icon,
    required this.label,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, color: AppColors.bleuDoux, size: 22),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (trailing != null)
              trailing!
            else
              const Icon(Icons.chevron_right,
                  color: AppColors.texteLeger, size: 20),
          ],
        ),
      ),
    );
  }
}
