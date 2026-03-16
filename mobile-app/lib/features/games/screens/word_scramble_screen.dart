import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/icon_mappings.dart';
import '../providers/game_provider.dart';

class WordScrambleScreen extends ConsumerStatefulWidget {
  const WordScrambleScreen({super.key});

  @override
  ConsumerState<WordScrambleScreen> createState() => _WordScrambleScreenState();
}

class _WordScrambleScreenState extends ConsumerState<WordScrambleScreen> {
  static const _words = [
    'NATURE',
    'SCIENCE',
    'LECTURE',
    'ANIMAL',
    'PLANTE',
    'ECOLE',
    'MUSIQUE',
    'SOLEIL',
    'RIVIERE',
    'MONTAGNE',
    'VILLAGE',
    'FAMILLE',
    'MARCHE',
    'JARDIN',
    'SAISON',
  ];

  late List<String> _gameWords;
  int _currentWordIndex = 0;
  late List<String> _scrambledLetters;
  List<int> _selectedIndices = [];
  String _currentAnswer = '';
  int _score = 0;
  int _errors = 0;
  final _random = Random();

  @override
  void initState() {
    super.initState();
    _startNewGame();
  }

  void _startNewGame() {
    final shuffled = List<String>.from(_words)..shuffle(_random);
    setState(() {
      _gameWords = shuffled.take(10).toList();
      _currentWordIndex = 0;
      _score = 0;
      _errors = 0;
    });
    _setupWord();
  }

  void _setupWord() {
    final word = _gameWords[_currentWordIndex];
    final letters = word.split('');
    // Shuffle until it's different from the original
    do {
      letters.shuffle(_random);
    } while (letters.join() == word && word.length > 1);

    setState(() {
      _scrambledLetters = letters;
      _selectedIndices = [];
      _currentAnswer = '';
    });
  }

  void _onLetterTap(int index) {
    if (_selectedIndices.contains(index)) return;

    setState(() {
      _selectedIndices.add(index);
      _currentAnswer += _scrambledLetters[index];
    });

    final word = _gameWords[_currentWordIndex];

    // Check if current partial answer is still valid
    if (!word.startsWith(_currentAnswer)) {
      _errors++;
      // Wrong path, reset
      Future.delayed(const Duration(milliseconds: 300), () {
        if (!mounted) return;
        setState(() {
          _selectedIndices.clear();
          _currentAnswer = '';
        });
      });
      return;
    }

    // Check if word is complete
    if (_currentAnswer == word) {
      _score++;
      if (_currentWordIndex < _gameWords.length - 1) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (!mounted) return;
          setState(() => _currentWordIndex++);
          _setupWord();
        });
      } else {
        // Game over
        _showResultDialog();
      }
    }
  }

  void _onReset() {
    setState(() {
      _selectedIndices.clear();
      _currentAnswer = '';
    });
  }

  void _showResultDialog() {
    final xp = max(10, _score * 10 - _errors * 2);
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
        title: const Text('Partie terminée !'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(AppIcons.wordScramble, size: 48, color: AppColors.vertNaturel),
            const SizedBox(height: 12),
            Text('Mots trouvés : $_score / ${_gameWords.length}'),
            Text('Erreurs : $_errors'),
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
              _startNewGame();
            },
            child: const Text('Rejouer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final word = _gameWords[_currentWordIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mots mélangés'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${_currentWordIndex + 1} / ${_gameWords.length}',
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
            // Progress
            LinearProgressIndicator(
              value: (_currentWordIndex) / _gameWords.length,
              backgroundColor: AppColors.grisClair,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.vertNaturel),
            ),
            const SizedBox(height: 24),

            // Instruction
            const Text(
              'Reconstitue le mot en tapant les lettres dans le bon ordre',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.texteSecondaire,
              ),
            ),
            const SizedBox(height: 24),

            // Answer display
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.bleuDoux.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.bleuDoux.withValues(alpha: 0.3),
                  width: 2,
                ),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(word.length, (i) {
                    final hasLetter = i < _currentAnswer.length;
                    return Container(
                      width: 36,
                      height: 44,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: hasLetter
                            ? AppColors.bleuDoux
                            : AppColors.blanc,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.bleuDoux,
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          hasLetter ? _currentAnswer[i] : '',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: hasLetter
                                ? AppColors.blanc
                                : AppColors.textePrincipal,
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Scrambled letters
            Wrap(
              spacing: 10,
              runSpacing: 10,
              alignment: WrapAlignment.center,
              children: List.generate(_scrambledLetters.length, (index) {
                final isUsed = _selectedIndices.contains(index);
                return GestureDetector(
                  onTap: isUsed ? null : () => _onLetterTap(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isUsed
                          ? AppColors.grisClair
                          : AppColors.jauneSoleil,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: isUsed
                          ? []
                          : [
                              BoxShadow(
                                color: AppColors.jauneSoleil
                                    .withValues(alpha: 0.4),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                    ),
                    child: Center(
                      child: Text(
                        _scrambledLetters[index],
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isUsed
                              ? AppColors.texteLeger
                              : AppColors.textePrincipal,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const Spacer(),

            // Reset button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _onReset,
                icon: const Icon(Icons.refresh),
                label: const Text('Recommencer le mot'),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Score : $_score  |  Erreurs : $_errors',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.texteSecondaire,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
