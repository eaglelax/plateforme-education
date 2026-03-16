import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Barre de progression animée avec pourcentage optionnel
class AnimatedProgressBar extends StatelessWidget {
  final double progress; // 0.0 to 1.0
  final Color? color;
  final Gradient? gradient;
  final double height;
  final bool showPercent;
  final Duration duration;

  const AnimatedProgressBar({
    super.key,
    required this.progress,
    this.color,
    this.gradient,
    this.height = 8,
    this.showPercent = false,
    this.duration = const Duration(milliseconds: 800),
  });

  @override
  Widget build(BuildContext context) {
    final clampedProgress = progress.clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (showPercent) ...[
          Text(
            '${(clampedProgress * 100).toInt()}%',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color ?? AppColors.bleuDoux,
            ),
          ),
          const SizedBox(height: 4),
        ],
        Container(
          height: height,
          decoration: BoxDecoration(
            color: AppColors.grisClair.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(height),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                children: [
                  AnimatedContainer(
                    duration: duration,
                    curve: Curves.easeOutCubic,
                    width: constraints.maxWidth * clampedProgress,
                    height: height,
                    decoration: BoxDecoration(
                      color: gradient == null ? (color ?? AppColors.bleuDoux) : null,
                      gradient: gradient,
                      borderRadius: BorderRadius.circular(height),
                      boxShadow: clampedProgress > 0
                          ? [
                              BoxShadow(
                                color: (color ?? AppColors.bleuDoux)
                                    .withValues(alpha: 0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ]
                          : null,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

/// Barre de progression circulaire (pour badges, niveaux)
class CircularProgress extends StatelessWidget {
  final double progress;
  final double size;
  final double strokeWidth;
  final Color? color;
  final Widget? center;

  const CircularProgress({
    super.key,
    required this.progress,
    this.size = 64,
    this.strokeWidth = 6,
    this.color,
    this.center,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: progress.clamp(0.0, 1.0)),
            duration: const Duration(milliseconds: 1000),
            curve: Curves.easeOutCubic,
            builder: (context, value, _) {
              return SizedBox(
                width: size,
                height: size,
                child: CircularProgressIndicator(
                  value: value,
                  strokeWidth: strokeWidth,
                  strokeCap: StrokeCap.round,
                  backgroundColor: AppColors.grisClair.withValues(alpha: 0.5),
                  valueColor: AlwaysStoppedAnimation(
                    color ?? AppColors.bleuDoux,
                  ),
                ),
              );
            },
          ),
          if (center != null) center!,
        ],
      ),
    );
  }
}

/// Barre de progression XP avec animation de remplissage
class XpProgressBar extends StatelessWidget {
  final int currentXp;
  final int xpPerLevel;
  final int level;

  const XpProgressBar({
    super.key,
    required this.currentXp,
    this.xpPerLevel = 200,
    required this.level,
  });

  @override
  Widget build(BuildContext context) {
    final xpInLevel = currentXp % xpPerLevel;
    final progress = xpInLevel / xpPerLevel;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Niveau $level',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textePrincipal,
              ),
            ),
            Text(
              '$xpInLevel / $xpPerLevel XP',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.texteSecondaire,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        AnimatedProgressBar(
          progress: progress,
          gradient: AppColors.primaryGradient,
          height: 10,
        ),
      ],
    );
  }
}
