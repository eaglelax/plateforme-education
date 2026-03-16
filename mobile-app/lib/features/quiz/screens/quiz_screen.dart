import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_card.dart';
import '../../../core/widgets/animated_progress_bar.dart';
import '../../../core/widgets/empty_state.dart';
import '../../content/models/contenu_model.dart';
import '../../home/providers/child_home_provider.dart';

/// Ecran 5: Quiz interactif — design moderne
class QuizScreen extends ConsumerStatefulWidget {
  final int contentId;

  const QuizScreen({super.key, required this.contentId});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentIndex = 0;
  Set<int> _selectedOptions = {};
  bool _answered = false;
  int _correctCount = 0;
  int _totalPoints = 0;
  Timer? _autoAdvanceTimer;
  bool _isAdvancing = false;
  bool _contentStarted = false;

  @override
  void initState() {
    super.initState();
    _startContent();
  }

  /// Register content start in the API (creates historique entry)
  Future<void> _startContent() async {
    if (_contentStarted) return;
    _contentStarted = true;
    try {
      final apiClient = ref.read(apiClientProvider);
      await demarrerContenu(apiClient, widget.contentId);
    } catch (_) {
      // Non-blocking — quiz works even if tracking fails
    }
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    super.dispose();
  }

  void _toggleOption(int index, QuestionModel question) {
    if (_answered) return;
    setState(() {
      if (question.type == 'choix_multiple') {
        if (_selectedOptions.contains(index)) {
          _selectedOptions.remove(index);
        } else {
          _selectedOptions.add(index);
        }
      } else {
        _selectedOptions = {index};
      }
    });
  }

  void _submitAnswer(QuestionModel question) {
    if (_selectedOptions.isEmpty || _answered) return;

    setState(() {
      _answered = true;

      if (question.type == 'choix_multiple') {
        final correctIndices = <int>{};
        for (int i = 0; i < question.reponses.length; i++) {
          if (question.reponses[i].estCorrecte) correctIndices.add(i);
        }
        if (_selectedOptions.length == correctIndices.length &&
            _selectedOptions.containsAll(correctIndices)) {
          _correctCount++;
          _totalPoints += question.points;
        }
      } else {
        final selectedIndex = _selectedOptions.first;
        if (selectedIndex < question.reponses.length &&
            question.reponses[selectedIndex].estCorrecte) {
          _correctCount++;
          _totalPoints += question.points;
        }
      }
    });

    _autoAdvanceTimer?.cancel();
    _autoAdvanceTimer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted && !_isAdvancing) {
        _nextQuestion();
      }
    });
  }

  void _nextQuestion() {
    if (_isAdvancing) return;
    _isAdvancing = true;
    _autoAdvanceTimer?.cancel();

    final quizAsync = ref.read(quizProvider(widget.contentId));
    final quiz = quizAsync.valueOrNull;
    if (quiz == null) {
      _isAdvancing = false;
      return;
    }

    if (_currentIndex < quiz.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOptions = {};
        _answered = false;
        _isAdvancing = false;
      });
    } else {
      final totalQuestions = quiz.questions.length;
      context.pushReplacement(
        '/enfant/quiz-resultat'
        '?score=$_correctCount'
        '&total=$totalQuestions'
        '&points=$_totalPoints'
        '&contenuId=${widget.contentId}',
      );
      _isAdvancing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final quizAsync = ref.watch(quizProvider(widget.contentId));

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: quizAsync.when(
        data: (quiz) {
          if (quiz == null || quiz.questions.isEmpty) {
            return Column(
              children: [
                AppBar(title: const Text('Quiz')),
                const Expanded(
                  child: EmptyState(
                    icon: Icons.quiz_rounded,
                    title: 'Aucun quiz disponible',
                    subtitle: 'Ce contenu n\'a pas encore de quiz',
                  ),
                ),
              ],
            );
          }

          if (_currentIndex >= quiz.questions.length) {
            _currentIndex = quiz.questions.length - 1;
          }

          final question = quiz.questions[_currentIndex];
          final total = quiz.questions.length;
          final isMultiple = question.type == 'choix_multiple';
          final progress = (_currentIndex + 1) / total;

          return Column(
            children: [
              // ─── App Bar gradient ───
              Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(8, 4, 16, 12),
                    child: Row(
                      children: [
                        IconButton(
                          icon: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.blanc.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close_rounded,
                                size: 20, color: AppColors.blanc),
                          ),
                          onPressed: () => context.pop(),
                        ),
                        Expanded(
                          child: Text(
                            quiz.titre,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppColors.blanc,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        // Counter + XP
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.blanc.withValues(alpha: 0.2),
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusRound),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${_currentIndex + 1}/$total',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.blanc,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.star_rounded,
                                  size: 14, color: AppColors.jauneSoleil),
                              Text(
                                '+$_totalPoints',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.jauneSoleil,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ─── Progress bar ───
              AnimatedProgressBar(
                progress: progress,
                gradient: AppColors.successGradient,
                height: 6,
                duration: const Duration(milliseconds: 400),
              ),

              // ─── Content ───
              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding,
                  child: Column(
                    children: [
                      AppSpacing.vLg,

                      // ─── Question card ───
                      AnimatedCard(
                        backgroundColor: AppColors.beige,
                        shadow: const [],
                        padding: const EdgeInsets.all(AppSpacing.xxl),
                        child: Column(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: AppColors.bleuDoux.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.help_outline_rounded,
                                  size: 28, color: AppColors.bleuDoux),
                            ),
                            AppSpacing.vMd,
                            Text(
                              question.texte,
                              style: AppTypography.heading3.copyWith(height: 1.5),
                              textAlign: TextAlign.center,
                            ),
                            if (isMultiple) ...[
                              AppSpacing.vSm,
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.violet.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(
                                      AppSpacing.radiusRound),
                                ),
                                child: const Text(
                                  'Plusieurs réponses possibles',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.violet,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      )
                          .animate(
                            key: ValueKey('q_$_currentIndex'),
                          )
                          .fadeIn(duration: 300.ms)
                          .slideY(begin: -0.05, curve: Curves.easeOutCubic),

                      AppSpacing.vXl,

                      // ─── Options ───
                      if (question.reponses.isEmpty)
                        const EmptyState(
                          icon: Icons.warning_rounded,
                          title: 'Aucune réponse disponible',
                          iconColor: AppColors.warning,
                        )
                      else
                        ...question.reponses.asMap().entries.map((entry) {
                          final index = entry.key;
                          final reponse = entry.value;
                          final letter = String.fromCharCode(65 + index);
                          final isSelected = _selectedOptions.contains(index);
                          return _QuizOption(
                            letter: letter,
                            text: reponse.texte,
                            isSelected: isSelected,
                            isCorrect: _answered && reponse.estCorrecte,
                            isWrong: _answered && isSelected && !reponse.estCorrecte,
                            isMultiple: isMultiple,
                            index: index,
                            onTap: _answered
                                ? null
                                : () => _toggleOption(index, question),
                          );
                        }),

                      // ─── Explanation ───
                      if (_answered && question.explication != null)
                        AnimatedCard(
                          backgroundColor: AppColors.beige,
                          borderColor: AppColors.jauneSoleil.withValues(alpha: 0.5),
                          shadow: const [],
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.lightbulb_rounded,
                                  size: 18, color: AppColors.jauneSoleil),
                              AppSpacing.hSm,
                              Expanded(
                                child: Text(
                                  question.explication!,
                                  style: AppTypography.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(duration: 400.ms)
                            .slideY(begin: 0.1),

                      AppSpacing.vXl,
                    ],
                  ),
                ),
              ),

              // ─── Bottom button ───
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                decoration: BoxDecoration(
                  color: AppColors.blanc,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _selectedOptions.isNotEmpty && !_answered
                          ? () => _submitAnswer(question)
                          : _answered
                              ? _nextQuestion
                              : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _answered
                            ? AppColors.vertNaturel
                            : AppColors.bleuDoux,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusMd),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _answered
                                ? (_currentIndex < total - 1
                                    ? 'Question suivante'
                                    : 'Voir les résultats')
                                : 'Valider ma réponse',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (_answered) ...[
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => Column(
          children: [
            Container(
              decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close_rounded,
                            color: AppColors.blanc),
                        onPressed: () => context.pop(),
                      ),
                      const Expanded(
                        child: Text(
                          'Quiz',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.blanc,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                ),
              ),
            ),
            const Expanded(
              child: Center(
                child: CircularProgressIndicator(color: AppColors.bleuDoux),
              ),
            ),
          ],
        ),
        error: (error, _) => Column(
          children: [
            AppBar(title: const Text('Quiz')),
            Expanded(
              child: ErrorState(
                message: 'Impossible de charger le quiz',
                onRetry: () =>
                    ref.invalidate(quizProvider(widget.contentId)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Option de quiz avec animation
class _QuizOption extends StatelessWidget {
  final String letter;
  final String text;
  final bool isSelected;
  final bool isCorrect;
  final bool isWrong;
  final bool isMultiple;
  final int index;
  final VoidCallback? onTap;

  const _QuizOption({
    required this.letter,
    required this.text,
    required this.isSelected,
    this.isCorrect = false,
    this.isWrong = false,
    this.isMultiple = false,
    this.index = 0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderColor = AppColors.grisClair;
    Color bgColor = AppColors.blanc;
    Color letterBg = AppColors.bleuDoux;
    Color letterColor = AppColors.blanc;

    if (isCorrect) {
      borderColor = AppColors.vertNaturel;
      bgColor = AppColors.vertNaturel.withValues(alpha: 0.08);
      letterBg = AppColors.vertNaturel;
    } else if (isWrong) {
      borderColor = AppColors.rougeErreur;
      bgColor = AppColors.rougeErreur.withValues(alpha: 0.08);
      letterBg = AppColors.rougeErreur;
    } else if (isSelected) {
      borderColor = AppColors.bleuDoux;
      bgColor = AppColors.bleuDoux.withValues(alpha: 0.06);
      letterBg = AppColors.bleuDoux;
    } else {
      letterBg = AppColors.grisClair;
      letterColor = AppColors.texteSecondaire;
    }

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: borderColor, width: 2),
          boxShadow: isSelected || isCorrect || isWrong
              ? [
                  BoxShadow(
                    color: borderColor.withValues(alpha: 0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            // Letter badge
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: letterBg,
                borderRadius:
                    BorderRadius.circular(isMultiple ? 8 : AppSpacing.radiusSm),
              ),
              child: Center(
                child: isCorrect
                    ? Icon(Icons.check_rounded, color: letterColor, size: 20)
                    : isWrong
                        ? Icon(Icons.close_rounded,
                            color: letterColor, size: 20)
                        : isSelected && isMultiple
                            ? Icon(Icons.check_rounded,
                                color: letterColor, size: 20)
                            : Text(
                                letter,
                                style: TextStyle(
                                  color: letterColor,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
              ),
            ),
            AppSpacing.hMd,
            // Text
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isCorrect
                      ? AppColors.vertNaturel
                      : isWrong
                          ? AppColors.rougeErreur
                          : AppColors.textePrincipal,
                ),
              ),
            ),
            // Result icon
            if (isCorrect)
              const Icon(Icons.check_circle_rounded,
                  color: AppColors.vertNaturel, size: 22),
            if (isWrong)
              const Icon(Icons.cancel_rounded,
                  color: AppColors.rougeErreur, size: 22),
          ],
        ),
      ),
    );
  }
}
