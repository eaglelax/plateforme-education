import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../../core/widgets/app_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/providers/child_home_provider.dart';
import '../../content/models/contenu_model.dart';
import '../providers/game_provider.dart';

/// Ecran Jeux - quiz rapides et défis du jour
class GamesScreen extends ConsumerWidget {
  const GamesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final enfant = authState.enfant;
    final contenusAsync = ref.watch(contenusProvider(null));
    final streakAsync = ref.watch(streakProvider);
    final dailyDone = ref.watch(dailyChallengeCompletedProvider);
    final gameLevel = ref.watch(gameLevelProvider);
    final gameXp = ref.watch(gameXpProvider);

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Jeux & Quiz'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(AppIcons.star, size: 18, color: AppColors.jauneSoleil),
                  const SizedBox(width: 4),
                  Text(
                    '${enfant?.pointsXp ?? 0}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(contenusProvider(null));
          ref.invalidate(streakProvider);
          ref.invalidate(dailyChallengeCompletedProvider);
          ref.invalidate(gameXpProvider);
          ref.invalidate(gameLevelProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Daily challenge card
              _DailyChallengeCard(
                completed: dailyDone,
                onPlay: () {
                  final contenus = contenusAsync.valueOrNull;
                  if (contenus != null && contenus.isNotEmpty) {
                    final withQuiz =
                        contenus.where((c) => c.hasQuiz).toList();
                    if (withQuiz.isNotEmpty) {
                      final today = DateTime.now().day;
                      final challenge =
                          withQuiz[today % withQuiz.length];
                      ref.read(gameScoreServiceProvider).completeDailyChallenge();
                      ref.invalidate(dailyChallengeCompletedProvider);
                      context.push('/enfant/quiz/${challenge.id}');
                    }
                  }
                },
              ),
              const SizedBox(height: 20),

              // Mini-games section
              const Text(
                'Mini-jeux',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textePrincipal,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _MiniGameCard(
                      iconData: AppIcons.memory,
                      title: 'Memoire',
                      color: AppColors.bleuDoux,
                      onTap: () => context.push('/enfant/jeux/memoire'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _MiniGameCard(
                      iconData: AppIcons.wordScramble,
                      title: 'Mots melanges',
                      color: AppColors.vertNaturel,
                      onTap: () => context.push('/enfant/jeux/mots'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _MiniGameCard(
                      iconData: AppIcons.mathChallenge,
                      title: 'Calcul',
                      color: AppColors.ocre,
                      onTap: () => context.push('/enfant/jeux/calcul'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Quick quiz section
              const Text(
                'Quiz rapides',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textePrincipal,
                ),
              ),
              const SizedBox(height: 12),
              contenusAsync.when(
                data: (contenus) {
                  final quizContenus =
                      contenus.where((c) => c.hasQuiz).toList();
                  if (quizContenus.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Column(
                          children: [
                            const Icon(AppIcons.games, size: 48, color: AppColors.texteSecondaire),
                            const SizedBox(height: 12),
                            const Text(
                              'Aucun quiz disponible pour le moment.\nExplore les domaines pour debloquer des jeux !',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: AppColors.texteSecondaire),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: [
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.85,
                        ),
                        itemCount: quizContenus.length.clamp(0, 6),
                        itemBuilder: (context, index) {
                          final contenu = quizContenus[index];
                          return _QuizGameCard(
                            contenu: contenu,
                            colorIndex: index,
                            onTap: () => context
                                .push('/enfant/quiz/${contenu.id}'),
                          );
                        },
                      ),
                      if (quizContenus.length > 6) ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () =>
                                context.go('/enfant/domaines'),
                            child: const Text(
                                'Voir tous les domaines'),
                          ),
                        ),
                      ],
                    ],
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(
                        color: AppColors.bleuDoux),
                  ),
                ),
                error: (_, _) => Center(
                  child: Column(
                    children: [
                      const Text('Erreur de chargement'),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () =>
                            ref.invalidate(contenusProvider(null)),
                        child: const Text('Reessayer'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Performance stats
              AppCard.beige(
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(AppIcons.trophy, size: 20, color: AppColors.jauneSoleil),
                        const SizedBox(width: 8),
                        const Text(
                          'Tes performances',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _PerformanceStat(
                          iconData: AppIcons.star,
                          iconColor: AppColors.jauneSoleil,
                          value: '${enfant?.pointsXp ?? 0}',
                          label: 'Points XP',
                        ),
                        _PerformanceStat(
                          iconData: AppIcons.chart,
                          iconColor: AppColors.bleuDoux,
                          value: 'Niv. ${enfant?.niveauGlobal ?? 1}',
                          label: 'Niveau',
                        ),
                        _PerformanceStat(
                          iconData: AppIcons.fire,
                          iconColor: AppColors.ocre,
                          value: streakAsync.when(
                            data: (s) => '$s',
                            loading: () => '...',
                            error: (_, _) => '0',
                          ),
                          label: 'Serie',
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.bleuDoux.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(AppIcons.games, size: 16, color: AppColors.bleuDoux),
                          const SizedBox(width: 8),
                          Text(
                            'Niveau jeux : $gameLevel  ($gameXp XP jeux)',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.bleuDoux,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniGameCard extends StatelessWidget {
  final IconData iconData;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _MiniGameCard({
    required this.iconData,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(iconData, size: 28, color: color),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _DailyChallengeCard extends StatelessWidget {
  final bool completed;
  final VoidCallback onPlay;

  const _DailyChallengeCard({required this.completed, required this.onPlay});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.bleuDoux, Color(0xFF1A5FB4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(AppIcons.target, size: 28, color: AppColors.jauneSoleil),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Defi du jour',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.blanc,
                    ),
                  ),
                  Text(
                    completed ? 'Defi termine !' : 'Gagne des points bonus !',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              if (completed) ...[
                const Spacer(),
                const Icon(AppIcons.check, size: 28, color: AppColors.vertNaturel),
              ],
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: completed ? null : onPlay,
              style: ElevatedButton.styleFrom(
                backgroundColor: completed ? Colors.white38 : AppColors.jauneSoleil,
                foregroundColor: AppColors.textePrincipal,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                completed ? 'Reviens demain !' : 'Jouer maintenant',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuizGameCard extends StatelessWidget {
  final ContenuModel contenu;
  final int colorIndex;
  final VoidCallback onTap;

  const _QuizGameCard({
    required this.contenu,
    required this.colorIndex,
    required this.onTap,
  });

  static const _colors = [
    AppColors.bleuDoux,
    AppColors.vertNaturel,
    AppColors.ocre,
    AppColors.jauneSoleil,
    Color(0xFF8E44AD),
    Color(0xFFE74C3C),
  ];

  @override
  Widget build(BuildContext context) {
    final color = _colors[colorIndex % _colors.length];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Icon(
                  contenu.typeIconData,
                  size: 24,
                  color: color,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              contenu.titre,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(AppIcons.star, size: 12, color: color),
                const SizedBox(width: 4),
                Text(
                  '${contenu.pointsXp} XP',
                  style: TextStyle(
                    fontSize: 11,
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PerformanceStat extends StatelessWidget {
  final IconData iconData;
  final Color iconColor;
  final String value;
  final String label;

  const _PerformanceStat({
    required this.iconData,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(iconData, size: 24, color: iconColor),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.texteSecondaire,
          ),
        ),
      ],
    );
  }
}
