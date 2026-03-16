import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../../core/widgets/animated_card.dart';
import '../../../core/widgets/animated_progress_bar.dart';
import '../../home/providers/child_home_provider.dart';

/// Ecran 6: Résultat du quiz — célébration animée + sauvegarde API
class QuizResultScreen extends ConsumerStatefulWidget {
  final int score;
  final int totalQuestions;
  final int pointsEarned;
  final String? badgeName;
  final int? contenuId;

  const QuizResultScreen({
    super.key,
    required this.score,
    required this.totalQuestions,
    required this.pointsEarned,
    this.badgeName,
    this.contenuId,
  });

  @override
  ConsumerState<QuizResultScreen> createState() => _QuizResultScreenState();
}

class _QuizResultScreenState extends ConsumerState<QuizResultScreen> {
  QuizResultData? _apiResult;
  bool _submitted = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _submitResult();
  }

  Future<void> _submitResult() async {
    if (_submitted || widget.contenuId == null) return;
    _submitted = true;
    setState(() => _submitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final result = await submitQuizResult(
        apiClient,
        widget.contenuId!,
        widget.score,
        widget.totalQuestions,
      );
      if (mounted) {
        setState(() {
          _apiResult = result;
          _submitting = false;
        });
        // Refresh auth state to update XP in nav
        ref.invalidate(mesBadgesProvider);
      }
    } catch (_) {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final result = _apiResult;
    final percent = widget.totalQuestions > 0
        ? (widget.score * 100 / widget.totalQuestions)
        : 0;
    final starCount = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
    final isSuccess = percent >= 60; // 60% threshold from API

    final mainColor = isSuccess ? AppColors.vertNaturel : AppColors.ocre;
    final mainGradient =
        isSuccess ? AppColors.successGradient : AppColors.warmGradient;

    // Use API data if available, else fallback to local
    final pointsEarned = result?.pointsGagnes ?? (isSuccess ? widget.pointsEarned : 0);
    final newBadges = result?.newBadges ?? [];
    final leveledUp = result?.leveledUp ?? false;
    final newLevel = result?.niveau ?? 1;

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xxxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // ─── Celebration icon ───
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: mainGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: mainColor.withValues(alpha: 0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Icon(
                    isSuccess
                        ? Icons.celebration_rounded
                        : Icons.trending_up_rounded,
                    size: 48,
                    color: AppColors.blanc,
                  ),
                )
                    .animate()
                    .scale(
                      begin: const Offset(0.0, 0.0),
                      end: const Offset(1.0, 1.0),
                      duration: 600.ms,
                      curve: Curves.elasticOut,
                    )
                    .then()
                    .shimmer(
                      duration: 1200.ms,
                      color: AppColors.blanc.withValues(alpha: 0.3),
                    ),

                AppSpacing.vXxl,

                // ─── Title ───
                Text(
                  isSuccess ? 'BRAVO !' : 'CONTINUE !',
                  style:
                      AppTypography.displayMedium.copyWith(color: mainColor),
                )
                    .animate()
                    .fadeIn(delay: 300.ms, duration: 500.ms)
                    .slideY(begin: 0.3, curve: Curves.easeOutCubic),

                AppSpacing.vSm,

                Text(
                  isSuccess
                      ? 'Tu as réussi le quiz !'
                      : 'Il te faut au moins 60% pour gagner les XP !',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.texteSecondaire,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 500.ms, duration: 400.ms),

                // ─── Saving indicator ───
                if (_submitting) ...[
                  AppSpacing.vMd,
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: mainColor,
                        ),
                      ),
                      AppSpacing.hSm,
                      Text(
                        'Sauvegarde en cours...',
                        style: TextStyle(
                          fontSize: 12,
                          color: mainColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],

                AppSpacing.vXxl,

                // ─── Score card ───
                AnimatedCard(
                  backgroundColor: AppColors.beige,
                  borderRadius: AppSpacing.radiusXl,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xxxl,
                    vertical: AppSpacing.xxl,
                  ),
                  shadow: [
                    BoxShadow(
                      color: mainColor.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                  child: Column(
                    children: [
                      // Stars
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(3, (i) {
                          final isFilled = i < starCount;
                          return Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              isFilled
                                  ? Icons.star_rounded
                                  : Icons.star_outline_rounded,
                              size: i == 1 ? 44 : 36,
                              color: isFilled
                                  ? AppColors.jauneSoleil
                                  : AppColors.grisClair,
                            )
                                .animate()
                                .scale(
                                  begin: const Offset(0.0, 0.0),
                                  end: const Offset(1.0, 1.0),
                                  delay: Duration(
                                      milliseconds: 600 + i * 200),
                                  duration: 500.ms,
                                  curve: Curves.elasticOut,
                                ),
                          );
                        }),
                      ),

                      AppSpacing.vLg,

                      // Score number with animation
                      TweenAnimationBuilder<int>(
                        tween: IntTween(begin: 0, end: widget.score),
                        duration: const Duration(milliseconds: 1200),
                        curve: Curves.easeOutCubic,
                        builder: (context, value, _) {
                          return Text(
                            '$value / ${widget.totalQuestions}',
                            style: AppTypography.scoreText,
                          );
                        },
                      ),

                      const Text(
                        'Bonnes réponses',
                        style: AppTypography.bodySmall,
                      ),

                      AppSpacing.vLg,

                      // Progress ring
                      CircularProgress(
                        progress: percent / 100,
                        size: 56,
                        strokeWidth: 5,
                        color: mainColor,
                        center: Text(
                          '${percent.toInt()}%',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: mainColor,
                          ),
                        ),
                      ),

                      // Best score indicator
                      if (result != null && !result.isNewBest) ...[
                        AppSpacing.vMd,
                        Text(
                          'Ton meilleur score : ${result.bestScore}/${widget.totalQuestions}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.texteSecondaire,
                          ),
                        ),
                      ],

                      if (pointsEarned > 0) ...[
                        AppSpacing.vLg,
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: AppSpacing.sm,
                          ),
                          decoration: BoxDecoration(
                            gradient: AppColors.successGradient,
                            borderRadius: BorderRadius.circular(
                                AppSpacing.radiusRound),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded,
                                  size: 18, color: AppColors.blanc),
                              AppSpacing.hXs,
                              Text(
                                '+ $pointsEarned XP',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.blanc,
                                ),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(delay: 1000.ms, duration: 400.ms)
                            .slideY(
                                begin: 0.5, curve: Curves.easeOutCubic)
                            .then()
                            .shimmer(
                              duration: 1500.ms,
                              color:
                                  AppColors.blanc.withValues(alpha: 0.4),
                            ),
                      ],

                      if (!isSuccess) ...[
                        AppSpacing.vLg,
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: AppSpacing.sm,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.ocre.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(
                                AppSpacing.radiusRound),
                          ),
                          child: const Text(
                            'Minimum 60% pour gagner les XP',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.ocre,
                            ),
                          ),
                        ).animate().fadeIn(delay: 1000.ms),
                      ],
                    ],
                  ),
                )
                    .animate()
                    .fadeIn(delay: 400.ms, duration: 600.ms)
                    .slideY(begin: 0.2, curve: Curves.easeOutCubic),

                // ─── Level up ───
                if (leveledUp) ...[
                  AppSpacing.vXl,
                  AnimatedCard(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6C5CE7), Color(0xFF2F80ED)],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.blanc.withValues(alpha: 0.2),
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusMd),
                          ),
                          child: Center(
                            child: Text(
                              '$newLevel',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppColors.blanc,
                              ),
                            ),
                          ),
                        ),
                        AppSpacing.hMd,
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Niveau supérieur !',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.blanc,
                                ),
                              ),
                              Text(
                                'Tu es maintenant niveau $newLevel',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color:
                                      AppColors.blanc.withValues(alpha: 0.8),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_upward_rounded,
                            size: 28, color: AppColors.jauneSoleil),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 1200.ms, duration: 500.ms)
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1.0, 1.0),
                        curve: Curves.elasticOut,
                      ),
                ],

                // ─── New badges ───
                ...newBadges.map((badge) => Padding(
                      padding: const EdgeInsets.only(top: AppSpacing.lg),
                      child: AnimatedCard(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.jauneSoleil.withValues(alpha: 0.15),
                            AppColors.ocre.withValues(alpha: 0.08),
                          ],
                        ),
                        borderColor: AppColors.jauneSoleil,
                        borderWidth: 2,
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppColors.warmGradient,
                                borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusMd),
                              ),
                              child: const Icon(AppIcons.trophy,
                                  size: 26, color: AppColors.blanc),
                            ),
                            AppSpacing.hMd,
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Nouveau badge !',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.texteSecondaire,
                                    ),
                                  ),
                                  Text(
                                    badge,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.ocre,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                          .animate()
                          .fadeIn(delay: 1400.ms, duration: 500.ms)
                          .slideX(begin: 0.2, curve: Curves.easeOutCubic)
                          .then()
                          .shimmer(
                            duration: 1500.ms,
                            color: AppColors.jauneSoleil
                                .withValues(alpha: 0.3),
                          ),
                    )),

                // Legacy badge (from query params, if API not available)
                if (newBadges.isEmpty && widget.badgeName != null) ...[
                  AppSpacing.vXl,
                  AnimatedCard(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.jauneSoleil.withValues(alpha: 0.15),
                        AppColors.ocre.withValues(alpha: 0.08),
                      ],
                    ),
                    borderColor: AppColors.jauneSoleil,
                    borderWidth: 2,
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            gradient: AppColors.warmGradient,
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusMd),
                          ),
                          child: const Icon(AppIcons.trophy,
                              size: 26, color: AppColors.blanc),
                        ),
                        AppSpacing.hMd,
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Nouveau badge !',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.texteSecondaire,
                                ),
                              ),
                              Text(
                                widget.badgeName!,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.ocre,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 1400.ms, duration: 500.ms)
                      .slideX(begin: 0.2, curve: Curves.easeOutCubic)
                      .then()
                      .shimmer(
                        duration: 1500.ms,
                        color:
                            AppColors.jauneSoleil.withValues(alpha: 0.3),
                      ),
                ],

                AppSpacing.vXxl,

                // ─── Action buttons ───
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          if (widget.contenuId != null) {
                            context.pushReplacement(
                                '/enfant/quiz/${widget.contenuId}');
                          } else {
                            context.pop();
                          }
                        },
                        icon: const Icon(AppIcons.refresh, size: 18),
                        label: const Text('Réessayer'),
                      ),
                    ),
                    AppSpacing.hMd,
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/enfant/accueil'),
                        icon: const Icon(Icons.arrow_forward_rounded,
                            size: 18),
                        label: const Text('Continuer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: mainColor,
                        ),
                      ),
                    ),
                  ],
                )
                    .animate()
                    .fadeIn(delay: 1200.ms, duration: 400.ms)
                    .slideY(begin: 0.3),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
