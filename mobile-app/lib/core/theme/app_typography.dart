import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Styles de texte réutilisables pour toute l'app
class AppTypography {
  AppTypography._();

  // ─── Titres ───
  static const TextStyle displayLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w800,
    color: AppColors.textePrincipal,
    height: 1.2,
    letterSpacing: -0.5,
  );

  static const TextStyle displayMedium = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    color: AppColors.textePrincipal,
    height: 1.2,
    letterSpacing: -0.3,
  );

  static const TextStyle heading1 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.textePrincipal,
    height: 1.3,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.textePrincipal,
    height: 1.3,
  );

  static const TextStyle heading3 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: AppColors.textePrincipal,
    height: 1.4,
  );

  // ─── Corps de texte ───
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.textePrincipal,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textePrincipal,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.texteSecondaire,
    height: 1.4,
  );

  // ─── Labels ───
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textePrincipal,
    height: 1.3,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: AppColors.texteSecondaire,
    height: 1.3,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: AppColors.texteLeger,
    height: 1.3,
  );

  // ─── Spéciaux ───
  static const TextStyle buttonText = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    height: 1.2,
  );

  static const TextStyle xpText = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.jauneSoleil,
  );

  static const TextStyle scoreText = TextStyle(
    fontSize: 48,
    fontWeight: FontWeight.w800,
    color: AppColors.textePrincipal,
    height: 1.0,
    letterSpacing: -1,
  );

  static const TextStyle badgeLabel = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.blanc,
    letterSpacing: 0.5,
  );
}
