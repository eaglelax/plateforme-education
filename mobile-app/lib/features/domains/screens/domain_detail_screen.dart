import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../../core/widgets/animated_card.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../home/providers/child_home_provider.dart';

class DomainDetailScreen extends ConsumerWidget {
  final int domainId;
  final String domainName;

  const DomainDetailScreen({
    super.key,
    required this.domainId,
    required this.domainName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contenusAsync = ref.watch(contenusProvider(domainId));
    // Determine domain color from index (fallback to blue)
    final domainesAsync = ref.watch(domainesProvider);
    final domainIndex = domainesAsync.valueOrNull
            ?.indexWhere((d) => d.id == domainId) ??
        0;
    final color = AppColors.domainColor(domainIndex >= 0 ? domainIndex : 0);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: CustomScrollView(
        slivers: [
          // ─── Header avec couleur du domaine ───
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: color,
            leading: IconButton(
              icon: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.blanc.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    size: 20, color: AppColors.blanc),
              ),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [color, color.withValues(alpha: 0.8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(60, 12, 20, 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.blanc.withValues(alpha: 0.2),
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusMd),
                          ),
                          child: Icon(
                            AppIcons.fromDomainName(domainName),
                            size: 30,
                            color: AppColors.blanc,
                          ),
                        )
                            .animate()
                            .scale(
                              begin: const Offset(0.5, 0.5),
                              end: const Offset(1, 1),
                              duration: 400.ms,
                              curve: Curves.easeOutBack,
                            ),
                        AppSpacing.vMd,
                        Text(
                          domainName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.blanc,
                          ),
                        ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                        contenusAsync.when(
                          data: (c) => Text(
                            '${c.length} leçons disponibles',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xBBFFFFFF),
                            ),
                          ),
                          loading: () => const SizedBox.shrink(),
                          error: (_, _) => const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ─── Content list ───
          SliverToBoxAdapter(
            child: contenusAsync.when(
              data: (contenus) {
                if (contenus.isEmpty) {
                  return const EmptyState(
                    icon: Icons.menu_book_rounded,
                    title: 'Aucun contenu disponible',
                    subtitle: 'Du contenu sera bientôt ajouté !',
                  );
                }

                return Padding(
                  padding: AppSpacing.screenPadding,
                  child: Column(
                    children: contenus.asMap().entries.map((entry) {
                      final index = entry.key;
                      final contenu = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: ContentCard(
                          icon: contenu.typeIconData,
                          title: contenu.titre,
                          subtitle: contenu.type.toUpperCase(),
                          badge: contenu.type.toUpperCase(),
                          color: color,
                          xp: contenu.pointsXp,
                          hasPremium: contenu.estPremium,
                          index: index,
                          onTap: () => context.push(
                            contenu.type == 'quiz'
                                ? '/enfant/quiz/${contenu.id}'
                                : '/enfant/contenu/${contenu.id}',
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                );
              },
              loading: () => Padding(
                padding: AppSpacing.screenPadding,
                child: const ShimmerList(itemCount: 5, itemHeight: 80),
              ),
              error: (error, _) => ErrorState(
                message: 'Erreur de chargement',
                onRetry: () => ref.invalidate(contenusProvider(domainId)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
