import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../auth/models/auth_state.dart';
import '../../auth/models/enfant_model.dart';
import '../../auth/providers/auth_provider.dart';

/// Ecran 1: Selection du profil enfant
class ChildSelectionScreen extends ConsumerStatefulWidget {
  const ChildSelectionScreen({super.key});

  @override
  ConsumerState<ChildSelectionScreen> createState() =>
      _ChildSelectionScreenState();
}

class _ChildSelectionScreenState extends ConsumerState<ChildSelectionScreen> {
  // Track if a modal is currently open to close it on auth success/error
  bool _modalOpen = false;

  @override
  Widget build(BuildContext context) {
    final enfantsAsync = ref.watch(enfantsProvider);
    final authState = ref.watch(authProvider);

    // Listen for auth state changes
    ref.listen<AuthState>(authProvider, (previous, next) {
      // On successful auth, close modal if open - GoRouter handles navigation
      if (next.isAuthenticated && next.isEnfant) {
        if (_modalOpen) {
          _modalOpen = false;
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          }
        }
      }
      // On error, close modal and show error
      if (next.status == AuthStatus.error && next.errorMessage != null) {
        if (_modalOpen) {
          _modalOpen = false;
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: AppColors.rougeErreur,
          ),
        );
        ref.read(authProvider.notifier).clearError();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: Stack(
        children: [
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(AppIcons.sun,
                        size: 80, color: AppColors.jauneSoleil),
                    const SizedBox(height: 20),
                    const Text(
                      'BONJOUR !',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: AppColors.bleuDoux,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Qui apprend aujourd\'hui ?',
                      style: TextStyle(
                        fontSize: 18,
                        color: AppColors.texteSecondaire,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Bouton principal: Connexion enfant par code
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed:
                            authState.isLoading ? null : _showCodeLoginDialog,
                        icon: const Icon(Icons.login),
                        label: const Text(
                          'J\'ai mon code',
                          style: TextStyle(fontSize: 16),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.vertNaturel,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Liste enfants (visible si parent connecte)
                    enfantsAsync.when(
                      data: (enfants) {
                        if (enfants.isEmpty) {
                          return const SizedBox.shrink();
                        }
                        return Column(
                          children: [
                            const Text(
                              'Ou choisis ton profil :',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.texteSecondaire,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 24,
                              runSpacing: 16,
                              alignment: WrapAlignment.center,
                              children: enfants
                                  .map((enfant) => _ProfileCard(
                                        enfant: enfant,
                                        isLoading: authState.isLoading,
                                        onTap: () => _showChildLogin(enfant),
                                      ))
                                  .toList(),
                            ),
                            const SizedBox(height: 24),
                          ],
                        );
                      },
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: CircularProgressIndicator(
                          color: AppColors.bleuDoux,
                        ),
                      ),
                      error: (error, _) => const SizedBox.shrink(),
                    ),

                    TextButton.icon(
                      onPressed: () => context.push('/login'),
                      icon: const Icon(AppIcons.lock,
                          size: 16, color: AppColors.texteSecondaire),
                      label: const Text(
                        'Espace Parent',
                        style: TextStyle(
                          color: AppColors.texteSecondaire,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Full-screen loading overlay during login - shows Faso Yiri branding
          if (authState.isLoading)
            Container(
              color: AppColors.fondBlanc,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // App branding
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.beige,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(
                        AppIcons.sun,
                        size: 64,
                        color: AppColors.jauneSoleil,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'FASO YIRI',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: AppColors.bleuDoux,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Connexion en cours...',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppColors.texteSecondaire,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const CircularProgressIndicator(color: AppColors.bleuDoux),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Dialog de connexion par code (pour enfants sans parent connecte)
  void _showCodeLoginDialog() {
    final codeCtrl = TextEditingController();
    final mdpCtrl = TextEditingController();

    _modalOpen = true;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
          children: [
            const Icon(AppIcons.childOlder,
                size: 48, color: AppColors.bleuDoux),
            const SizedBox(height: 8),
            const Text(
              'Connexion Enfant',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: codeCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Code de connexion',
                hintText: 'Ex: ENF-XXXXXX',
                prefixIcon: Icon(Icons.badge_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: mdpCtrl,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mot de passe',
                prefixIcon: Icon(Icons.lock_outline),
              ),
              onSubmitted: (_) {
                final code = codeCtrl.text.trim();
                final mdp = mdpCtrl.text;
                if (code.isNotEmpty && mdp.isNotEmpty) {
                  _loginWithCode(code, mdp);
                }
              },
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final code = codeCtrl.text.trim();
                  final mdp = mdpCtrl.text;
                  if (code.isEmpty || mdp.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Remplis le code et le mot de passe'),
                      ),
                    );
                    return;
                  }
                  _loginWithCode(code, mdp);
                },
                child: const Text('C\'est parti !'),
              ),
            ),
          ],
        ),
      ),
    ).whenComplete(() {
      _modalOpen = false;
    });
  }

  void _loginWithCode(String code, String motDePasse) {
    ref.read(authProvider.notifier).loginEnfant(
          codeConnexion: code,
          motDePasse: motDePasse,
        );
  }

  void _showChildLogin(EnfantModel enfant) {
    final controller = TextEditingController();
    final isPin = enfant.modeConnexion == 'pin';

    _modalOpen = true;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
          children: [
            Icon(enfant.displayAvatarIcon, size: 48, color: AppColors.bleuDoux),
            const SizedBox(height: 8),
            Text(
              enfant.nomPseudo,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: controller,
              obscureText: true,
              keyboardType: isPin ? TextInputType.number : TextInputType.text,
              maxLength: isPin ? 4 : null,
              decoration: InputDecoration(
                labelText: isPin ? 'Code PIN' : 'Mot de passe',
                prefixIcon: const Icon(Icons.lock_outline),
              ),
              onSubmitted: (_) {
                if (controller.text.isNotEmpty) {
                  _loginChild(enfant, controller.text, isPin);
                }
              },
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (controller.text.isEmpty) return;
                  _loginChild(enfant, controller.text, isPin);
                },
                child: const Text('C\'est parti !'),
              ),
            ),
          ],
        ),
      ),
    ).whenComplete(() {
      _modalOpen = false;
    });
  }

  void _loginChild(EnfantModel enfant, String credential, bool isPin) {
    ref.read(authProvider.notifier).loginEnfant(
          codeConnexion: enfant.codeConnexion,
          pin: isPin ? credential : null,
          motDePasse: isPin ? null : credential,
        );
  }
}

class _ProfileCard extends StatelessWidget {
  final EnfantModel enfant;
  final bool isLoading;
  final VoidCallback onTap;

  const _ProfileCard({
    required this.enfant,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: AnimatedOpacity(
        opacity: isLoading ? 0.5 : 1.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          decoration: BoxDecoration(
            color: AppColors.beige,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            children: [
              Icon(enfant.displayAvatarIcon,
                  size: 64, color: AppColors.bleuDoux),
              const SizedBox(height: 12),
              Text(
                enfant.nomPseudo.toUpperCase(),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textePrincipal,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${enfant.age} ans',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.texteSecondaire,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
