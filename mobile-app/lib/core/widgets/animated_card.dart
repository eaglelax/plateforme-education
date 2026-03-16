import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Carte animée avec effet de scale au tap et entrée fluide
class AnimatedCard extends StatefulWidget {
  final Widget child;
  final Color? backgroundColor;
  final Gradient? gradient;
  final Color? borderColor;
  final double borderWidth;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final double borderRadius;
  final List<BoxShadow>? shadow;

  const AnimatedCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.gradient,
    this.borderColor,
    this.borderWidth = 1.5,
    this.padding,
    this.onTap,
    this.borderRadius = AppSpacing.radiusLg,
    this.shadow,
  });

  /// Carte avec gradient
  factory AnimatedCard.gradient({
    required Widget child,
    required Gradient gradient,
    EdgeInsets? padding,
    VoidCallback? onTap,
  }) {
    return AnimatedCard(
      gradient: gradient,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }

  @override
  State<AnimatedCard> createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<AnimatedCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: Container(
          padding: widget.padding ?? AppSpacing.cardPadding,
          decoration: BoxDecoration(
            color: widget.gradient == null
                ? (widget.backgroundColor ?? AppColors.blanc)
                : null,
            gradient: widget.gradient,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: widget.borderColor != null
                ? Border.all(
                    color: widget.borderColor!,
                    width: widget.borderWidth,
                  )
                : null,
            boxShadow: widget.shadow ??
                [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
          ),
          child: widget.child,
        ),
      ),
    );
  }
}

/// Carte de domaine éducatif avec icône et couleur
class DomainCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final int index;

  const DomainCard({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedCard(
      backgroundColor: color.withValues(alpha: 0.08),
      borderColor: color.withValues(alpha: 0.2),
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.md,
        horizontal: AppSpacing.sm,
      ),
      shadow: const [],
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(icon, size: 26, color: color),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color.withValues(alpha: 0.9),
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
          delay: Duration(milliseconds: 50 * index),
          duration: const Duration(milliseconds: 400),
        )
        .slideY(
          begin: 0.15,
          end: 0,
          delay: Duration(milliseconds: 50 * index),
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
        );
  }
}

/// Carte de contenu (dans la liste d'un domaine)
class ContentCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? badge;
  final Color color;
  final int xp;
  final bool hasPremium;
  final VoidCallback onTap;
  final int index;

  const ContentCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.badge,
    required this.color,
    required this.xp,
    this.hasPremium = false,
    required this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedCard(
      backgroundColor: AppColors.blanc,
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        children: [
          // Icon
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withValues(alpha: 0.7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Icon(icon, size: 26, color: AppColors.blanc),
          ),
          const SizedBox(width: AppSpacing.md),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textePrincipal,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    if (badge != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Text(
                          badge!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                    ],
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.texteSecondaire,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // XP + Arrow
          Column(
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star_rounded,
                      size: 16, color: AppColors.jauneSoleil),
                  const SizedBox(width: 2),
                  Text(
                    '$xp',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.jauneSoleil,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Icon(Icons.arrow_forward_ios_rounded,
                  size: 14, color: AppColors.texteLeger),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(
          delay: Duration(milliseconds: 60 * index),
          duration: const Duration(milliseconds: 400),
        )
        .slideX(
          begin: 0.08,
          end: 0,
          delay: Duration(milliseconds: 60 * index),
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
        );
  }
}
