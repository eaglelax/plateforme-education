import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ─── Palette principale ───
  static const Color bleuDoux = Color(0xFF2F80ED);
  static const Color vertNaturel = Color(0xFF27AE60);
  static const Color jauneSoleil = Color(0xFFF2C94C);
  static const Color ocre = Color(0xFFF2994A);
  static const Color beige = Color(0xFFFFF8ED);
  static const Color fondBlanc = Color(0xFFFAFAFA);

  // ─── Couleurs secondaires (éducation / gamification) ───
  static const Color violet = Color(0xFF9B51E0);
  static const Color rose = Color(0xFFEB5757);
  static const Color turquoise = Color(0xFF2ECCC7);
  static const Color indigoClair = Color(0xFF6C5CE7);

  // ─── Sémantique ───
  static const Color success = Color(0xFF27AE60);
  static const Color warning = Color(0xFFF2994A);
  static const Color error = Color(0xFFEB5757);
  static const Color info = Color(0xFF2F80ED);

  // ─── Textes ───
  static const Color textePrincipal = Color(0xFF1A1A2E);
  static const Color texteSecondaire = Color(0xFF5A5A7A);
  static const Color texteLeger = Color(0xFF9999B5);

  // ─── Utilitaires ───
  static const Color blanc = Color(0xFFFFFFFF);
  static const Color grisClair = Color(0xFFE8E8F0);
  static const Color rougeErreur = Color(0xFFEB5757);

  // ─── Couleurs par domaine éducatif ───
  static const List<Color> domainColors = [
    Color(0xFF2F80ED), // Informatique
    Color(0xFF27AE60), // Sciences
    Color(0xFF9B51E0), // Lecture
    Color(0xFFF2994A), // Maths
    Color(0xFF2ECCC7), // Langues
    Color(0xFFEB5757), // Histoire
    Color(0xFFF2C94C), // Art
    Color(0xFF6C5CE7), // Musique
    Color(0xFF00B894), // Géographie
    Color(0xFFE17055), // Sport
  ];

  // ─── Gradients ───
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF2F80ED), Color(0xFF6C5CE7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF27AE60), Color(0xFF2ECCC7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFFF2994A), Color(0xFFF2C94C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient celebrationGradient = LinearGradient(
    colors: [Color(0xFF6C5CE7), Color(0xFFEB5757), Color(0xFFF2C94C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Retourne une couleur de domaine par index (boucle si > 10)
  static Color domainColor(int index) =>
      domainColors[index % domainColors.length];
}
