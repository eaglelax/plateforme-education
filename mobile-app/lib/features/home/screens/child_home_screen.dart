import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../../core/widgets/animated_card.dart';
import '../../../core/widgets/animated_progress_bar.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../core/widgets/xp_badge.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/child_home_provider.dart';

/// Ecran 2: Accueil enfant — design moderne et gamifié
class ChildHomeScreen extends ConsumerWidget {
  const ChildHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final enfant = authState.enfant;
    final domainesAsync = ref.watch(domainesProvider);
    final lastContentAsync = ref.watch(lastInProgressProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(domainesProvider);
          ref.invalidate(lastInProgressProvider);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ─── App Bar avec gradient ───
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              automaticallyImplyLeading: false,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top row: avatar + XP + logout
                          Row(
                            children: [
                              // Avatar
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.blanc.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  enfant?.displayAvatarIcon ?? AppIcons.childOlder,
                                  size: 24,
                                  color: AppColors.blanc,
                                ),
                              ),
                              AppSpacing.hMd,
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Salut ${enfant?.nomPseudo ?? ""} !',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.blanc,
                                      ),
                                    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1),
                                    const Text(
                                      "Prêt à apprendre aujourd'hui ?",
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Color(0xBBFFFFFF),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              XpBadge(xp: enfant?.pointsXp ?? 0),
                              AppSpacing.hSm,
                              GestureDetector(
                                onTap: () => _showLogoutDialog(context, ref),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: AppColors.blanc.withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    AppIcons.logout,
                                    size: 18,
                                    color: AppColors.blanc,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          AppSpacing.vMd,
                          // XP progress bar
                          if (enfant != null)
                            XpProgressBar(
                              currentXp: enfant.pointsXp,
                              level: enfant.niveauGlobal,
                            ).animate().fadeIn(delay: 200.ms, duration: 500.ms),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              backgroundColor: AppColors.bleuDoux,
            ),

            // ─── Content ───
            SliverToBoxAdapter(
              child: Padding(
                padding: AppSpacing.screenPadding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppSpacing.vSm,

                    // ─── Continuer l'apprentissage ───
                    lastContentAsync.when(
                      data: (lastContent) {
                        if (lastContent == null) return const SizedBox.shrink();
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SectionHeader(
                              title: 'Continue ton aventure',
                              icon: Icons.play_circle_outline_rounded,
                              color: AppColors.ocre,
                            ),
                            AnimatedCard(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.ocre.withValues(alpha: 0.08),
                                  AppColors.jauneSoleil.withValues(alpha: 0.05),
                                ],
                              ),
                              borderColor: AppColors.ocre.withValues(alpha: 0.3),
                              onTap: () => context.push(
                                  '/enfant/contenu/${lastContent.contenuId}'),
                              child: Row(
                                children: [
                                  Container(
                                    width: 50,
                                    height: 50,
                                    decoration: BoxDecoration(
                                      gradient: AppColors.warmGradient,
                                      borderRadius: BorderRadius.circular(
                                          AppSpacing.radiusMd),
                                    ),
                                    child: Icon(
                                      lastContent.domaineIconData,
                                      size: 26,
                                      color: AppColors.blanc,
                                    ),
                                  ),
                                  AppSpacing.hMd,
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          lastContent.titre,
                                          style: AppTypography.labelLarge,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (lastContent.domaineNom != null)
                                          Text(
                                            lastContent.domaineNom!,
                                            style: AppTypography.labelSmall,
                                          ),
                                        AppSpacing.vSm,
                                        AnimatedProgressBar(
                                          progress:
                                              lastContent.progression / 100,
                                          gradient: AppColors.warmGradient,
                                          showPercent: true,
                                          height: 6,
                                        ),
                                      ],
                                    ),
                                  ),
                                  AppSpacing.hSm,
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      gradient: AppColors.warmGradient,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.ocre
                                              .withValues(alpha: 0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.play_arrow_rounded,
                                      color: AppColors.blanc,
                                      size: 26,
                                    ),
                                  ),
                                ],
                              ),
                            )
                                .animate()
                                .fadeIn(duration: 500.ms)
                                .slideY(begin: 0.1, curve: Curves.easeOutCubic),
                            AppSpacing.vXxl,
                          ],
                        );
                      },
                      loading: () => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
                        child: const ShimmerCard(height: 90),
                      ),
                      error: (_, _) => const SizedBox.shrink(),
                    ),

                    // ─── Grille des domaines ───
                    const SectionHeader(
                      title: 'Explore les domaines',
                      icon: Icons.explore_rounded,
                    ),
                    domainesAsync.when(
                      data: (domaines) => GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: AppSpacing.md,
                          mainAxisSpacing: AppSpacing.md,
                          childAspectRatio: 0.85,
                        ),
                        itemCount: domaines.length,
                        itemBuilder: (context, index) {
                          final d = domaines[index];
                          return DomainCard(
                            icon: d.displayIconData,
                            label: d.nom,
                            color: AppColors.domainColor(index),
                            index: index,
                            onTap: () => context.push(
                              '/enfant/domaine/${d.id}?name=${Uri.encodeComponent(d.nom)}',
                            ),
                          );
                        },
                      ),
                      loading: () => const ShimmerGrid(
                        crossAxisCount: 3,
                        itemCount: 9,
                      ),
                      error: (error, _) => ErrorState(
                        message: 'Impossible de charger les domaines',
                        onRetry: () => ref.invalidate(domainesProvider),
                      ),
                    ),

                    AppSpacing.vXxl,

                    // ─── Accès rapide quiz ───
                    const SectionHeader(
                      title: 'Quiz rapides',
                      icon: Icons.quiz_rounded,
                      color: AppColors.vertNaturel,
                    ),
                    _QuickQuizSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        ),
        title: Row(
          children: [
            Icon(Icons.logout_rounded, color: AppColors.rougeErreur, size: 24),
            AppSpacing.hMd,
            const Text('Se déconnecter'),
          ],
        ),
        content: const Text('Tu veux vraiment te déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Non'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.rougeErreur,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Oui, quitter'),
          ),
        ],
      ),
    );
  }
}

/// Section quiz rapides (contenus avec quiz)
class _QuickQuizSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contenusAsync = ref.watch(contenusProvider(null));

    return contenusAsync.when(
      data: (contenus) {
        final quizContenus =
            contenus.where((c) => c.hasQuiz).take(4).toList();
        if (quizContenus.isEmpty) {
          return AnimatedCard(
            backgroundColor: AppColors.vertNaturel.withValues(alpha: 0.05),
            borderColor: AppColors.vertNaturel.withValues(alpha: 0.2),
            shadow: const [],
            child: Row(
              children: [
                Icon(Icons.emoji_events_rounded,
                    size: 32, color: AppColors.vertNaturel),
                AppSpacing.hMd,
                Expanded(
                  child: Text(
                    'Les quiz apparaîtront ici quand tu auras du contenu !',
                    style: AppTypography.bodySmall,
                  ),
                ),
              ],
            ),
          );
        }
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: quizContenus.asMap().entries.map((entry) {
            final i = entry.key;
            final c = entry.value;
            final color = AppColors.domainColor(i + 3);
            return AnimatedCard(
              backgroundColor: color.withValues(alpha: 0.08),
              borderColor: color.withValues(alpha: 0.2),
              shadow: const [],
              onTap: () => context.push('/enfant/quiz/${c.id}'),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.quiz_rounded, size: 16, color: color),
                  AppSpacing.hSm,
                  Flexible(
                    child: Text(
                      c.titre,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(
                  delay: Duration(milliseconds: 100 * i),
                  duration: 400.ms,
                )
                .slideX(begin: 0.1, curve: Curves.easeOutCubic);
          }).toList(),
        );
      },
      loading: () => const ShimmerCard(height: 40),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}
