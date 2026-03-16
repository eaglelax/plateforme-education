import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_progress_bar.dart';
import '../../models/statistiques_model.dart';
import '../../providers/parent_provider.dart';
import '../../../../core/utils/icon_mappings.dart';

/// Ecran 11: Statistiques enfant (dynamique)
class ChildStatisticsScreen extends ConsumerStatefulWidget {
  final int enfantId;
  final String enfantName;

  const ChildStatisticsScreen({
    super.key,
    required this.enfantId,
    required this.enfantName,
  });

  @override
  ConsumerState<ChildStatisticsScreen> createState() =>
      _ChildStatisticsScreenState();
}

class _ChildStatisticsScreenState
    extends ConsumerState<ChildStatisticsScreen> {
  int _selectedPeriod = 0; // 0: 7j, 1: 30j, 2: 365j

  int get _periodeJours =>
      _selectedPeriod == 0 ? 7 : (_selectedPeriod == 1 ? 30 : 365);

  @override
  Widget build(BuildContext context) {
    final statsParams = (
      enfantId: widget.enfantId,
      periode: _periodeJours,
    );
    final statsAsync = ref.watch(statistiquesEnfantProvider(statsParams));
    final tempsAsync = ref.watch(tempsEcranProvider(statsParams));
    final progressionAsync =
        ref.watch(progressionEnfantProvider(widget.enfantId));

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        title: Text('Statistiques : ${widget.enfantName}'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(statistiquesEnfantProvider(statsParams));
          ref.invalidate(tempsEcranProvider(statsParams));
          ref.invalidate(progressionEnfantProvider(widget.enfantId));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Period selector
              Row(
                children: [
                  _PeriodButton(
                    label: 'Cette semaine',
                    isActive: _selectedPeriod == 0,
                    onTap: () => setState(() => _selectedPeriod = 0),
                  ),
                  const SizedBox(width: 8),
                  _PeriodButton(
                    label: 'Ce mois',
                    isActive: _selectedPeriod == 1,
                    onTap: () => setState(() => _selectedPeriod = 1),
                  ),
                  const SizedBox(width: 8),
                  _PeriodButton(
                    label: 'Total',
                    isActive: _selectedPeriod == 2,
                    onTap: () => setState(() => _selectedPeriod = 2),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Summary cards
              statsAsync.when(
                data: (stats) => _SummaryRow(stats: stats),
                loading: () => const SizedBox(
                  height: 60,
                  child: Center(
                      child: CircularProgressIndicator(
                          color: AppColors.bleuDoux)),
                ),
                error: (_, _) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 16),

              // Usage time chart
              tempsAsync.when(
                data: (temps) => _UsageTimeChart(data: temps),
                loading: () => AppCard(
                  child: SizedBox(
                    height: 140,
                    child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.bleuDoux)),
                  ),
                ),
                error: (_, _) => const AppCard(
                  child: Center(
                    child: Text('Données de temps non disponibles'),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Domain progression
              progressionAsync.when(
                data: (progression) =>
                    _DomainProgressionCard(progression: progression),
                loading: () => AppCard(
                  child: SizedBox(
                    height: 100,
                    child: Center(
                        child: CircularProgressIndicator(
                            color: AppColors.bleuDoux)),
                  ),
                ),
                error: (_, _) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 16),

              // Top domains
              statsAsync.when(
                data: (stats) => stats.topDomaines.isNotEmpty
                    ? _TopDomainesCard(domaines: stats.topDomaines)
                    : const SizedBox.shrink(),
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =========================================
// Summary row
// =========================================

class _SummaryRow extends StatelessWidget {
  final StatistiquesEnfant stats;

  const _SummaryRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            icon: AppIcons.clock,
            value: stats.tempsFormate,
            label: 'Temps total',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SummaryCard(
            icon: AppIcons.check,
            value: '${stats.contenusCompletes}',
            label: 'Complétés',
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _SummaryCard(
            icon: AppIcons.star,
            value: '${stats.pointsGagnes}',
            label: 'Points XP',
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _SummaryCard({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.beige,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: AppColors.bleuDoux),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.textePrincipal,
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
      ),
    );
  }
}

// =========================================
// Usage time chart
// =========================================

class _UsageTimeChart extends StatelessWidget {
  final TempsEcranData data;

  const _UsageTimeChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final jours = data.parJour;
    final maxMinutes =
        jours.isEmpty ? 60 : jours.map((j) => j.minutes).reduce(max);
    final chartMax = maxMinutes > 0 ? maxMinutes.toDouble() : 60.0;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(AppIcons.chart, size: 16, color: AppColors.bleuDoux),
              SizedBox(width: 6),
              Text(
                'Temps d\'utilisation',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: jours.isEmpty
                ? const Center(
                    child: Text(
                      'Aucune donnée pour cette période',
                      style: TextStyle(color: AppColors.texteSecondaire),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: jours.map((jour) {
                      final height = chartMax > 0
                          ? (jour.minutes / chartMax * 90).clamp(4.0, 90.0)
                          : 4.0;
                      final isToday = jour.jour ==
                          DateTime.now().toIso8601String().split('T')[0];
                      return _BarItem(
                        height: height,
                        label: jour.jourCourt,
                        minutes: jour.minutes,
                        isToday: isToday,
                      );
                    }).toList(),
                  ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Total : ${_formatMinutes(data.totalMinutes)}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.texteSecondaire,
                  ),
                ),
                const SizedBox(width: 16),
                Text(
                  'Moy : ${data.moyenneQuotidienne}min/j',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.texteSecondaire,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatMinutes(int minutes) {
    if (minutes < 60) return '${minutes}min';
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return m > 0 ? '${h}h ${m}min' : '${h}h';
  }
}

// =========================================
// Domain progression card
// =========================================

class _DomainProgressionCard extends StatelessWidget {
  final ProgressionEnfant progression;

  const _DomainProgressionCard({required this.progression});

  @override
  Widget build(BuildContext context) {
    if (progression.parDomaine.isEmpty) return const SizedBox.shrink();

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(AppIcons.chartLine, size: 16, color: AppColors.bleuDoux),
                  SizedBox(width: 6),
                  Text(
                    'Progression par domaine',
                    style:
                        TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              if (progression.niveauGlobal.isNotEmpty)
                Text(
                  progression.niveauGlobal,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.bleuDoux,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...progression.parDomaine.map((domaine) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _DomainProgress(
                  iconData: AppIcons.fromDomainName(domaine.nom),
                  name: domaine.nom,
                  progress: domaine.pourcentageComplete / 100,
                  detail:
                      '${domaine.contenusCompletes}/${domaine.contenusTotal}',
                ),
              )),
        ],
      ),
    );
  }
}

// =========================================
// Top domaines card
// =========================================

class _TopDomainesCard extends StatelessWidget {
  final List<StatistiquesDomaine> domaines;

  const _TopDomainesCard({required this.domaines});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(AppIcons.target, size: 16, color: AppColors.bleuDoux),
              SizedBox(width: 6),
              Text(
                'Domaines preferes',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...domaines.take(5).map((d) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(AppIcons.fromDomainName(d.nom), size: 20, color: AppColors.bleuDoux),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        d.nom,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text(
                      '${d.pointsTotaux} XP',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.bleuDoux,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

// =========================================
// Reusable widgets
// =========================================

class _PeriodButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _PeriodButton({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? AppColors.bleuDoux : AppColors.fondBlanc,
            borderRadius: BorderRadius.circular(8),
            border: isActive
                ? null
                : Border.all(color: AppColors.grisClair),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color:
                  isActive ? AppColors.blanc : AppColors.texteSecondaire,
            ),
          ),
        ),
      ),
    );
  }
}

class _BarItem extends StatelessWidget {
  final double height;
  final String label;
  final int minutes;
  final bool isToday;

  const _BarItem({
    required this.height,
    required this.label,
    required this.minutes,
    required this.isToday,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          if (minutes > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                '${minutes}m',
                style: const TextStyle(
                    fontSize: 9, color: AppColors.texteSecondaire),
              ),
            ),
          Container(
            width: 28,
            height: height,
            decoration: BoxDecoration(
              color: isToday
                  ? AppColors.ocre
                  : AppColors.bleuDoux,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: isToday ? FontWeight.w700 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

class _DomainProgress extends StatelessWidget {
  final IconData iconData;
  final String name;
  final double progress;
  final String? detail;

  const _DomainProgress({
    required this.iconData,
    required this.name,
    required this.progress,
    this.detail,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(iconData, size: 14, color: AppColors.bleuDoux),
                const SizedBox(width: 4),
                Text(name, style: const TextStyle(fontSize: 13)),
              ],
            ),
            Row(
              children: [
                if (detail != null) ...[
                  Text(
                    detail!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.texteSecondaire,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  '${(progress * 100).round()}%',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 4),
        AppProgressBar(
          progress: progress.clamp(0.0, 1.0),
          color: AppColors.vertNaturel,
        ),
      ],
    );
  }
}
