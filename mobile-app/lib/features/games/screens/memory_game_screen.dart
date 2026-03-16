import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/icon_mappings.dart';
import '../providers/game_provider.dart';

class _MemoryCard {
  final int id;
  final IconData iconData;
  final String label;
  bool isFaceUp = false;
  bool isMatched = false;

  _MemoryCard({
    required this.id,
    required this.iconData,
    required this.label,
  });
}

class MemoryGameScreen extends ConsumerStatefulWidget {
  const MemoryGameScreen({super.key});

  @override
  ConsumerState<MemoryGameScreen> createState() => _MemoryGameScreenState();
}

class _MemoryGameScreenState extends ConsumerState<MemoryGameScreen> {
  late int _pairCount;
  late List<(IconData, String)> _currentPairs;

  late List<_MemoryCard> _cards;
  int _attempts = 0;
  int _matchesFound = 0;
  int? _firstFlippedIndex;
  bool _isChecking = false;
  late Stopwatch _stopwatch;
  Timer? _timer;
  String _elapsed = '0:00';

  @override
  void initState() {
    super.initState();
    _pairCount = ref.read(memoryPairCountProvider);
    _currentPairs = AppIcons.memoryPairs(_pairCount);
    _startNewGame();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startNewGame() {
    _timer?.cancel();
    _pairCount = ref.read(memoryPairCountProvider);
    _currentPairs = AppIcons.memoryPairs(_pairCount);
    final cards = <_MemoryCard>[];
    for (var i = 0; i < _currentPairs.length; i++) {
      cards.add(_MemoryCard(id: i, iconData: _currentPairs[i].$1, label: _currentPairs[i].$2));
      cards.add(_MemoryCard(id: i, iconData: _currentPairs[i].$1, label: _currentPairs[i].$2));
    }
    cards.shuffle(Random());
    setState(() {
      _cards = cards;
      _attempts = 0;
      _matchesFound = 0;
      _firstFlippedIndex = null;
      _isChecking = false;
      _elapsed = '0:00';
    });
    _stopwatch = Stopwatch()..start();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final s = _stopwatch.elapsed.inSeconds;
      setState(() => _elapsed = '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}');
    });
  }

  void _onCardTap(int index) {
    if (_isChecking) return;
    if (_cards[index].isFaceUp || _cards[index].isMatched) return;

    setState(() => _cards[index].isFaceUp = true);

    if (_firstFlippedIndex == null) {
      _firstFlippedIndex = index;
    } else {
      _attempts++;
      _isChecking = true;
      final firstIndex = _firstFlippedIndex!;
      _firstFlippedIndex = null;

      if (_cards[firstIndex].id == _cards[index].id) {
        // Match!
        setState(() {
          _cards[firstIndex].isMatched = true;
          _cards[index].isMatched = true;
          _matchesFound++;
          _isChecking = false;
        });
        if (_matchesFound == _currentPairs.length) {
          _stopwatch.stop();
          _timer?.cancel();
          _showResultDialog();
        }
      } else {
        // No match, flip back after delay
        Future.delayed(const Duration(milliseconds: 800), () {
          if (!mounted) return;
          setState(() {
            _cards[firstIndex].isFaceUp = false;
            _cards[index].isFaceUp = false;
            _isChecking = false;
          });
        });
      }
    }
  }

  void _showResultDialog() {
    final xp = max(10, 60 - (_attempts - _currentPairs.length) * 5);
    final service = ref.read(gameScoreServiceProvider);
    service.recordPlay();
    service.addGameXp(xp);
    ref.invalidate(streakProvider);
    ref.invalidate(gameXpProvider);
    ref.invalidate(gameLevelProvider);
    ref.invalidate(memoryPairCountProvider);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Bravo !'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(AppIcons.celebration, size: 48, color: AppColors.jauneSoleil),
            const SizedBox(height: 12),
            Text('Tentatives : $_attempts'),
            Text('Temps : $_elapsed'),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jeu de mémoire'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '$_elapsed  |  $_attempts essais',
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Trouve les ${_currentPairs.length} paires !',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.builder(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: _pairCount >= 6 ? 4 : 3,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.8,
                ),
                itemCount: _cards.length,
                itemBuilder: (context, index) {
                  final card = _cards[index];
                  final isVisible = card.isFaceUp || card.isMatched;

                  return GestureDetector(
                    onTap: () => _onCardTap(index),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      decoration: BoxDecoration(
                        color: card.isMatched
                            ? AppColors.vertNaturel.withValues(alpha: 0.2)
                            : isVisible
                                ? AppColors.bleuDoux.withValues(alpha: 0.1)
                                : AppColors.bleuDoux,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: card.isMatched
                              ? AppColors.vertNaturel
                              : AppColors.bleuDoux,
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: isVisible
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(card.iconData, size: 32, color: AppColors.bleuDoux),
                                  const SizedBox(height: 4),
                                  Text(
                                    card.label,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              )
                            : const Text('?',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.blanc,
                                )),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
