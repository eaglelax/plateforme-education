import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_card.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../core/widgets/xp_badge.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/providers/child_home_provider.dart';

class DomainsListScreen extends ConsumerWidget {
  const DomainsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final domainesAsync = ref.watch(domainesProvider);
    final enfant = ref.watch(authProvider).enfant;

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: CustomScrollView(
        slivers: [
          // ─── Header ───
          SliverAppBar(
            expandedHeight: 100,
            floating: false,
            pinned: true,
            automaticallyImplyLeading: false,
            backgroundColor: AppColors.bleuDoux,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Row(
                      children: [
                        const Icon(Icons.explore_rounded,
                            size: 28, color: AppColors.blanc),
                        AppSpacing.hMd,
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Domaines',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.blanc,
                                ),
                              ),
                              Text(
                                'Choisis ta matière préférée',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xBBFFFFFF),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (enfant != null) XpBadge(xp: enfant.pointsXp),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ─── Domain list ───
          SliverToBoxAdapter(
            child: Padding(
              padding: AppSpacing.screenPadding,
              child: domainesAsync.when(
                data: (domaines) {
                  if (domaines.isEmpty) {
                    return const EmptyState(
                      icon: Icons.school_rounded,
                      title: 'Aucun domaine disponible',
                      subtitle: 'Les domaines seront bientôt ajoutés !',
                    );
                  }
                  return Column(
                    children: domaines.asMap().entries.map((entry) {
                      final index = entry.key;
                      final d = entry.value;
                      final color = AppColors.domainColor(index);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: AnimatedCard(
                          backgroundColor: AppColors.blanc,
                          onTap: () => context.push(
                            '/enfant/domaine/${d.id}?name=${Uri.encodeComponent(d.nom)}',
                          ),
                          child: Row(
                            children: [
                              // Icon avec couleur unique
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      color,
                                      color.withValues(alpha: 0.7),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(
                                      AppSpacing.radiusMd),
                                ),
                                child: Icon(d.displayIconData,
                                    size: 26, color: AppColors.blanc),
                              ),
                              AppSpacing.hLg,
                              // Texte
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      d.nom,
                                      style: AppTypography.heading3,
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Icon(Icons.menu_book_rounded,
                                            size: 14, color: color),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${d.contenusCount} leçons',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: color,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              // Arrow
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  size: 16,
                                  color: color,
                                ),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(
                              delay: Duration(milliseconds: 60 * index),
                              duration: 400.ms,
                            )
                            .slideX(
                              begin: 0.08,
                              end: 0,
                              delay: Duration(milliseconds: 60 * index),
                              duration: 400.ms,
                              curve: Curves.easeOutCubic,
                            ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const ShimmerList(itemCount: 8),
                error: (e, _) => ErrorState(
                  message: 'Erreur de chargement',
                  onRetry: () => ref.invalidate(domainesProvider),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
