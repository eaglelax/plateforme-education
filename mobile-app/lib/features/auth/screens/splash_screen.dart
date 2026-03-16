import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

/// Splash screen shown while checking auth state
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Trigger auto-login check
    Future.microtask(() {
      ref.read(authProvider.notifier).tryAutoLogin();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.bleuDoux,
                borderRadius: BorderRadius.circular(28),
              ),
              child: const Center(
                child: Text(
                  'FY',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    color: AppColors.blanc,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Faso Yiri',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.bleuDoux,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Plateforme Éducative',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.texteSecondaire,
              ),
            ),
            const SizedBox(height: 40),
            const CircularProgressIndicator(
              color: AppColors.bleuDoux,
              strokeWidth: 3,
            ),
          ],
        ),
      ),
    );
  }
}
