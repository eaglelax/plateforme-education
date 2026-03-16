import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/icon_mappings.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/game_provider.dart';

class _MathQuestion {
  final String question;
  final int correctAnswer;
  final List<int> choices;

  _MathQuestion({
    required this.question,
    required this.correctAnswer,
    required this.choices,
  });
}

class MathChallengeScreen extends ConsumerStatefulWidget {
  const MathChallengeScreen({super.key});

  @override
  ConsumerState<MathChallengeScreen> createState() =>
      _MathChallengeScreenState();
}

class _MathChallengeScreenState extends ConsumerState<MathChallengeScreen> {
  static const _totalQuestions = 10;
  static const _timePerQuestion = 15;

  final _random = Random();
  late List<_MathQuestion> _questions;
  int _currentIndex = 0;
  int _score = 0;
  int _timeLeft = _timePerQuestion;
  Timer? _timer;
  int? _selectedAnswer;
  bool _answered = false;

  @override
  void initState() {
    super.initState();
    _generateQuestions();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _generateQuestions() {
    final enfant = ref.read(authProvider).enfant;
    final age = enfant?.age ?? 8;
    _questions = List.generate(_totalQuestions, (_) => _generateQuestion(age));
  }

  _MathQuestion _generateQuestion(int age) {
    // Young children (<=7): simple addition/subtraction (1-10)
    // Older children (>7): multiplication and harder operations
    if (age <= 7) {
      final isAdd = _random.nextBool();
      final a = _random.nextInt(10) + 1;
      final b = _random.nextInt(10) + 1;
      if (isAdd) {
        return _buildQuestion('$a + $b', a + b);
      } else {
        final big = max(a, b);
        final small = min(a, b);
        return _buildQuestion('$big - $small', big - small);
      }
    } else {
      final op = _random.nextInt(3); // 0=add, 1=sub, 2=mult
      if (op == 0) {
        final a = _random.nextInt(50) + 10;
        final b = _random.nextInt(50) + 10;
        return _buildQuestion('$a + $b', a + b);
      } else if (op == 1) {
        final a = _random.nextInt(50) + 20;
        final b = _random.nextInt(20) + 1;
        return _buildQuestion('$a - $b', a - b);
      } else {
        final a = _random.nextInt(10) + 2;
        final b = _random.nextInt(10) + 2;
        return _buildQuestion('$a × $b', a * b);
      }
    }
  }

  _MathQuestion _buildQuestion(String question, int correct) {
    final choices = <int>{correct};
    while (choices.length < 4) {
      final offset = _random.nextInt(11) - 5;
      final wrong = correct + offset;
      if (wrong != correct && wrong >= 0) choices.add(wrong);
    }
    final shuffled = choices.toList()..shuffle(_random);
    return _MathQuestion(
      question: question,
      correctAnswer: correct,
      choices: shuffled,
    );
  }

  void _startTimer() {
    _timer?.cancel();
    _timeLeft = _timePerQuestion;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _timeLeft--);
      if (_timeLeft <= 0) {
        _onTimeUp();
      }
    });
  }

  void _onTimeUp() {
    if (_answered) return;
    setState(() => _answered = true);
    _timer?.cancel();
    _nextQuestion();
  }

  void _onAnswerSelected(int answer) {
    if (_answered) return;

    setState(() {
      _selectedAnswer = answer;
      _answered = true;
    });
    _timer?.cancel();

    if (answer == _questions[_currentIndex].correctAnswer) {
      _score++;
    }

    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      _nextQuestion();
    });
  }

  void _nextQuestion() {
    if (_currentIndex < _totalQuestions - 1) {
      setState(() {
        _currentIndex++;
        _selectedAnswer = null;
        _answered = false;
      });
      _startTimer();
    } else {
      _timer?.cancel();
      _showResultDialog();
    }
  }

  void _showResultDialog() {
    final xp = _score * 10;
    final service = ref.read(gameScoreServiceProvider);
    service.recordPlay();
    service.addGameXp(xp);
    ref.invalidate(streakProvider);
    ref.invalidate(gameXpProvider);
    ref.invalidate(gameLevelProvider);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Résultat !'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _score >= 8 ? AppIcons.trophy : _score >= 5 ? AppIcons.celebration : AppIcons.muscle,
              size: 48,
              color: _score >= 8 ? AppColors.jauneSoleil : _score >= 5 ? AppColors.vertNaturel : AppColors.ocre,
            ),
            const SizedBox(height: 12),
            Text(
              '$_score / $_totalQuestions',
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _score >= 8
                  ? 'Excellent !'
                  : _score >= 5
                      ? 'Bien joué !'
                      : 'Continue à t\'entraîner !',
              style: const TextStyle(color: AppColors.texteSecondaire),
            ),
            const SizedBox(height: 8),
            Text(
              '+$xp XP',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.vertNaturel,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Retour'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _currentIndex = 0;
                _score = 0;
                _selectedAnswer = null;
                _answered = false;
              });
              _generateQuestions();
              _startTimer();
            },
            child: const Text('Rejouer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final question = _questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Défi calcul'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${_currentIndex + 1} / $_totalQuestions',
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Progress bar
            LinearProgressIndicator(
              value: (_currentIndex) / _totalQuestions,
              backgroundColor: AppColors.grisClair,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.bleuDoux),
            ),
            const SizedBox(height: 16),

            // Timer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Score : $_score',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _timeLeft <= 5
                        ? AppColors.rougeErreur.withValues(alpha: 0.1)
                        : AppColors.bleuDoux.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.timer,
                        size: 18,
                        color: _timeLeft <= 5
                            ? AppColors.rougeErreur
                            : AppColors.bleuDoux,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_timeLeft}s',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: _timeLeft <= 5
                              ? AppColors.rougeErreur
                              : AppColors.bleuDoux,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),

            // Question
            Text(
              question.question,
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '= ?',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: AppColors.texteSecondaire,
              ),
            ),
            const Spacer(),

            // Answer choices
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.2,
              physics: const NeverScrollableScrollPhysics(),
              children: question.choices.map((choice) {
                final isCorrect = choice == question.correctAnswer;
                final isSelected = _selectedAnswer == choice;
                Color bgColor;
                Color borderColor;

                if (_answered && isCorrect) {
                  bgColor = AppColors.vertNaturel.withValues(alpha: 0.2);
                  borderColor = AppColors.vertNaturel;
                } else if (_answered && isSelected && !isCorrect) {
                  bgColor = AppColors.rougeErreur.withValues(alpha: 0.2);
                  borderColor = AppColors.rougeErreur;
                } else {
                  bgColor = AppColors.bleuDoux.withValues(alpha: 0.08);
                  borderColor = AppColors.bleuDoux.withValues(alpha: 0.3);
                }

                return GestureDetector(
                  onTap: () => _onAnswerSelected(choice),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        '$choice',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
