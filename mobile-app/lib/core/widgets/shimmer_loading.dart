import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Skeleton loader avec effet shimmer pour remplacer les spinners
class ShimmerLoading extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = AppSpacing.radiusMd,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.grisClair,
      highlightColor: AppColors.blanc,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.grisClair,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Grid de cartes shimmer (pour domaines, contenus, badges)
class ShimmerGrid extends StatelessWidget {
  final int crossAxisCount;
  final int itemCount;
  final double childAspectRatio;

  const ShimmerGrid({
    super.key,
    this.crossAxisCount = 3,
    this.itemCount = 9,
    this.childAspectRatio = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.grisClair.withValues(alpha: 0.5),
      highlightColor: AppColors.blanc,
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
          childAspectRatio: childAspectRatio,
        ),
        itemCount: itemCount,
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color: AppColors.grisClair,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
        ),
      ),
    );
  }
}

/// Carte shimmer pour le "continue learning"
class ShimmerCard extends StatelessWidget {
  final double height;

  const ShimmerCard({super.key, this.height = 80});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.grisClair.withValues(alpha: 0.5),
      highlightColor: AppColors.blanc,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.grisClair,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
      ),
    );
  }
}

/// Liste shimmer (pour historique, contenus)
class ShimmerList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;

  const ShimmerList({super.key, this.itemCount = 5, this.itemHeight = 72});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.grisClair.withValues(alpha: 0.5),
      highlightColor: AppColors.blanc,
      child: Column(
        children: List.generate(
          itemCount,
          (i) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Container(
              height: itemHeight,
              decoration: BoxDecoration(
                color: AppColors.grisClair,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
