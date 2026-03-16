import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
import '../../home/providers/child_home_provider.dart';
import '../models/badge_model.dart';

/// Ecran 7: Mes trophées — design gamifié moderne
class BadgesScreen extends ConsumerWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final enfant = authState.enfant;
    final badgesAsync = ref.watch(mesBadgesProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(mesBadgesProvider),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ─── Header avec profil ───
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              automaticallyImplyLeading: false,
              backgroundColor: AppColors.bleuDoux,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF6C5CE7), Color(0xFF2F80ED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: AppSpacing.screenPadding,
                      child: Column(
                        children: [
                          // Title row
                          Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  'Mes Trophées',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.blanc,
                                  ),
                                ),
                              ),
                              XpBadge(xp: enfant?.pointsXp ?? 0),
                            ],
                          ),
                          AppSpacing.vXl,
                          // Profile card
                          Row(
                            children: [
                              // Avatar avec level
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 64,
                                    height: 64,
                                    decoration: BoxDecoration(
                                      color: AppColors.blanc.withValues(alpha: 0.2),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: AppColors.blanc.withValues(alpha: 0.5),
                                        width: 3,
                                      ),
                                    ),
                                    child: Icon(
                                      enfant?.displayAvatarIcon ?? AppIcons.childOlder,
                                      size: 32,
                                      color: AppColors.blanc,
                                    ),
                                  ),
                                  Positioned(
                                    bottom: -4,
                                    right: -4,
                                    child: LevelBadge(
                                      level: enfant?.niveauGlobal ?? 1,
                                      size: 28,
                                    ),
                                  ),
                                ],
                              ),
                              AppSpacing.hLg,
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      enfant?.nomPseudo ?? 'Enfant',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.blanc,
                                      ),
                                    ),
                                    AppSpacing.vSm,
                                    // XP bar — progressive level formula
                                    Builder(builder: (context) {
                                      final xp = enfant?.pointsXp ?? 0;
                                      final progress = LevelSystem.progressInLevel(xp);
                                      final level = LevelSystem.levelFromXp(xp);
                                      final nextThreshold = LevelSystem.xpThreshold(level + 1);
                                      final currentThreshold = LevelSystem.xpThreshold(level);
                                      final xpInLevel = xp - currentThreshold;
                                      final gap = nextThreshold - currentThreshold;
                                      return Row(
                                        children: [
                                          Expanded(
                                            child: AnimatedProgressBar(
                                              progress: progress,
                                              color: AppColors.jauneSoleil,
                                              height: 8,
                                            ),
                                          ),
                                          AppSpacing.hSm,
                                          Text(
                                            '$xpInLevel/$gap',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xBBFFFFFF),
                                            ),
                                          ),
                                        ],
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ─── Badges content ───
            SliverToBoxAdapter(
              child: Padding(
                padding: AppSpacing.screenPadding,
                child: badgesAsync.when(
                  data: (badges) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppSpacing.vSm,

                      // ─── Obtenus ───
                      SectionHeader(
                        title: 'Obtenus (${badges.totalObtenus})',
                        icon: Icons.emoji_events_rounded,
                        color: AppColors.jauneSoleil,
                      ),
                      if (badges.obtenus.isEmpty)
                        AnimatedCard(
                          backgroundColor: AppColors.jauneSoleil.withValues(alpha: 0.05),
                          shadow: const [],
                          child: Row(
                            children: [
                              Icon(Icons.lightbulb_outline_rounded,
                                  color: AppColors.jauneSoleil, size: 28),
                              AppSpacing.hMd,
                              Expanded(
                                child: Text(
                                  'Continue à apprendre pour débloquer ton premier badge !',
                                  style: AppTypography.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            crossAxisSpacing: AppSpacing.md,
                            mainAxisSpacing: AppSpacing.md,
                            childAspectRatio: 0.75,
                          ),
                          itemCount: badges.obtenus.length,
                          itemBuilder: (context, index) {
                            final badge = badges.obtenus[index];
                            return _BadgeItem(
                              badge: badge,
                              locked: false,
                              index: index,
                              onTap: () => _showBadgeDetail(context, badge),
                            );
                          },
                        ),

                      AppSpacing.vXxl,

                      // ─── À débloquer ───
                      if (badges.aObtenir.isNotEmpty) ...[
                        SectionHeader(
                          title: 'À débloquer (${badges.aObtenir.length})',
                          icon: Icons.lock_outline_rounded,
                          color: AppColors.texteSecondaire,
                        ),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            crossAxisSpacing: AppSpacing.md,
                            mainAxisSpacing: AppSpacing.md,
                            childAspectRatio: 0.75,
                          ),
                          itemCount: badges.aObtenir.length,
                          itemBuilder: (context, index) {
                            final badge = badges.aObtenir[index];
                            return _BadgeItem(
                              badge: badge,
                              locked: true,
                              index: index,
                              onTap: () =>
                                  _showLockedBadgeDetail(context, badge),
                            );
                          },
                        ),
                      ],

                      AppSpacing.vXxl,
                    ],
                  ),
                  loading: () => Column(
                    children: [
                      AppSpacing.vLg,
                      const ShimmerGrid(
                        crossAxisCount: 4,
                        itemCount: 8,
                        childAspectRatio: 0.75,
                      ),
                    ],
                  ),
                  error: (error, _) => ErrorState(
                    message: 'Impossible de charger les badges',
                    onRetry: () => ref.invalidate(mesBadgesProvider),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showBadgeDetail(BuildContext context, BadgeModel badge) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        decoration: const BoxDecoration(
          color: AppColors.blanc,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.grisClair,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            AppSpacing.vXl,
            // Badge icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: AppColors.warmGradient,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.jauneSoleil.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Icon(badge.displayIconData, size: 36, color: AppColors.blanc),
            ),
            AppSpacing.vLg,
            Text(badge.nom, style: AppTypography.heading2),
            AppSpacing.vSm,
            Text(
              badge.description,
              style: AppTypography.bodySmall,
              textAlign: TextAlign.center,
            ),
            if (badge.dateObtention != null) ...[
              AppSpacing.vMd,
              StatusBadgeWidget(
                icon: Icons.calendar_today_rounded,
                text: 'Obtenu le ${_formatDate(badge.dateObtention!)}',
                color: AppColors.vertNaturel,
              ),
            ],
            AppSpacing.vXl,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Super !'),
              ),
            ),
            AppSpacing.vSm,
          ],
        ),
      ),
    );
  }

  void _showLockedBadgeDetail(BuildContext context, BadgeModel badge) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        decoration: const BoxDecoration(
          color: AppColors.blanc,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusXl),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.grisClair,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            AppSpacing.vXl,
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.grisClair,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
              child: const Icon(Icons.lock_rounded,
                  size: 32, color: AppColors.texteSecondaire),
            ),
            AppSpacing.vLg,
            Text(badge.nom, style: AppTypography.heading2),
            AppSpacing.vSm,
            Text(
              badge.description,
              style: AppTypography.bodySmall,
              textAlign: TextAlign.center,
            ),
            AppSpacing.vLg,
            AnimatedCard(
              backgroundColor: AppColors.ocre.withValues(alpha: 0.08),
              borderColor: AppColors.ocre.withValues(alpha: 0.3),
              shadow: const [],
              child: Row(
                children: [
                  const Icon(AppIcons.target, size: 20, color: AppColors.ocre),
                  AppSpacing.hMd,
                  Expanded(
                    child: Text(
                      _conditionText(badge),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ocre,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            AppSpacing.vXl,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Compris !'),
              ),
            ),
            AppSpacing.vSm,
          ],
        ),
      ),
    );
  }

  String _conditionText(BadgeModel badge) {
    // Use condition_obtention from API if available
    if (badge.conditionObtention != null && badge.conditionObtention!.isNotEmpty) {
      return badge.conditionObtention!;
    }
    return 'Continue à apprendre pour débloquer ce badge !';
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

/// Badge item avec animation d'entrée
class _BadgeItem extends StatelessWidget {
  final BadgeModel badge;
  final bool locked;
  final int index;
  final VoidCallback onTap;

  const _BadgeItem({
    required this.badge,
    required this.locked,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: locked
                  ? null
                  : const LinearGradient(
                      colors: [Color(0xFFFFC107), Color(0xFFFF9800)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
              color: locked ? AppColors.grisClair : null,
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              boxShadow: locked
                  ? null
                  : [
                      BoxShadow(
                        color: AppColors.jauneSoleil.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
            ),
            child: Icon(
              locked ? Icons.lock_rounded : badge.displayIconData,
              size: locked ? 22 : 28,
              color: locked ? AppColors.texteSecondaire : AppColors.blanc,
            ),
          ),
          AppSpacing.vSm,
          Text(
            badge.nom,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: locked ? AppColors.texteLeger : AppColors.textePrincipal,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: 60 * index),
          duration: 400.ms,
        )
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.0, 1.0),
          delay: Duration(milliseconds: 60 * index),
          duration: 400.ms,
          curve: Curves.easeOutBack,
        );
  }
}

/// Petit badge de statut (utilisé dans les modals)
class StatusBadgeWidget extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const StatusBadgeWidget({
    super.key,
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          AppSpacing.hSm,
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
