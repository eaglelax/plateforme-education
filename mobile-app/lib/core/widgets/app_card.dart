import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final Color? borderColor;
  final EdgeInsets? padding;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.child,
    this.backgroundColor,
    this.borderColor,
    this.padding,
    this.onTap,
  });

  factory AppCard.beige({
    required Widget child,
    EdgeInsets? padding,
    VoidCallback? onTap,
  }) {
    return AppCard(
      backgroundColor: AppColors.beige,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }

  factory AppCard.highlight({
    required Widget child,
    EdgeInsets? padding,
    VoidCallback? onTap,
  }) {
    return AppCard(
      backgroundColor: AppColors.beige,
      borderColor: AppColors.ocre,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }

  factory AppCard.success({
    required Widget child,
    EdgeInsets? padding,
    VoidCallback? onTap,
  }) {
    return AppCard(
      backgroundColor: AppColors.vertNaturel.withValues(alpha: 0.1),
      borderColor: AppColors.vertNaturel,
      padding: padding,
      onTap: onTap,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundColor ?? AppColors.blanc,
          borderRadius: BorderRadius.circular(16),
          border: borderColor != null
              ? Border(left: BorderSide(color: borderColor!, width: 4))
              : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
