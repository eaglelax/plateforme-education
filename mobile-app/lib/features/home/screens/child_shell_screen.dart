import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/bottom_nav_bar.dart';
import '../providers/kiosk_provider.dart';

/// Shell screen for child navigation (bottom nav bar)
class ChildShellScreen extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const ChildShellScreen({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isKiosk = ref.watch(isKioskActiveProvider);

    return PopScope(
      canPop: !isKiosk,
      child: Scaffold(
        body: Stack(
          children: [
            navigationShell,
            // Kiosk indicator
            if (isKiosk)
              Positioned(
                top: MediaQuery.of(context).padding.top + 4,
                right: 8,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.ocre.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock, size: 12, color: AppColors.blanc),
                      SizedBox(width: 4),
                      Text(
                        'Kiosque',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.blanc,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        bottomNavigationBar: ChildBottomNavBar(
          currentIndex: navigationShell.currentIndex,
          onTap: (index) {
            // In kiosk mode, block access to Games (index 2) and Badges (index 3)
            if (isKiosk && index > 1) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Cette section est restreinte par le contrôle parental.',
                  ),
                  backgroundColor: AppColors.ocre,
                  duration: Duration(seconds: 2),
                ),
              );
              return;
            }
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
        ),
      ),
    );
  }
}
