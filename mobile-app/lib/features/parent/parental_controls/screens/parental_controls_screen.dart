import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_card.dart';
import '../../models/parametres_parentaux_model.dart';
import '../../providers/parent_provider.dart';
import '../../../../core/utils/icon_mappings.dart';

/// Ecran 10: Controle parental (dynamique)
class ParentalControlsScreen extends ConsumerStatefulWidget {
  final int enfantId;
  final String enfantName;

  const ParentalControlsScreen({
    super.key,
    required this.enfantId,
    required this.enfantName,
  });

  @override
  ConsumerState<ParentalControlsScreen> createState() =>
      _ParentalControlsScreenState();
}

class _ParentalControlsScreenState
    extends ConsumerState<ParentalControlsScreen> {
  ParametresParentaux? _params;
  bool _saving = false;
  bool _hasChanges = false;

  void _initFromApi(ParametresParentaux params) {
    if (_params == null) {
      _params = params;
    }
  }

  void _updateParams(ParametresParentaux Function(ParametresParentaux) updater) {
    setState(() {
      _params = updater(_params!);
      _hasChanges = true;
    });
  }

  Future<void> _save() async {
    if (_params == null || _saving) return;
    setState(() => _saving = true);
    try {
      final dio = ref.read(parentDioProvider);
      await sauvegarderParametres(dio, widget.enfantId, _params!);
      ref.invalidate(parametresParentauxProvider(widget.enfantId));
      setState(() => _hasChanges = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Paramètres enregistrés !'),
            backgroundColor: AppColors.vertNaturel,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final paramsAsync =
        ref.watch(parametresParentauxProvider(widget.enfantId));
    final enfantAsync = ref.watch(enfantDetailProvider(widget.enfantId));

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      appBar: AppBar(
        title: Text('Contrôles : ${widget.enfantName}'),
      ),
      body: paramsAsync.when(
        data: (apiParams) {
          _initFromApi(apiParams);
          final params = _params!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Child info
                AppCard.beige(
                  child: Row(
                    children: [
                      enfantAsync.when(
                        data: (e) => Icon(e.displayAvatarIcon, size: 48, color: AppColors.bleuDoux),
                        loading: () => const Icon(AppIcons.childOlder, size: 48, color: AppColors.bleuDoux),
                        error: (_, _) => const Icon(AppIcons.childOlder, size: 48, color: AppColors.bleuDoux),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.enfantName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          enfantAsync.when(
                            data: (e) => Text(
                              '${e.age} ans • Niveau ${e.niveauGlobal}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.texteSecondaire,
                              ),
                            ),
                            loading: () => const SizedBox.shrink(),
                            error: (_, _) => const SizedBox.shrink(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Screen time limit
                const Row(
                  children: [
                    Icon(AppIcons.clock, size: 18, color: AppColors.bleuDoux),
                    SizedBox(width: 8),
                    Text(
                      'Temps d\'ecran',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textePrincipal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Limite journalière',
                            style: TextStyle(
                                fontSize: 14, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${params.tempsMaxQuotidien} min',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.bleuDoux,
                            ),
                          ),
                        ],
                      ),
                      Slider(
                        value: params.tempsMaxQuotidien.toDouble(),
                        min: 15,
                        max: 180,
                        divisions: 33,
                        activeColor: AppColors.bleuDoux,
                        onChanged: (value) {
                          _updateParams((p) => p.copyWith(
                              tempsMaxQuotidien: value.round()));
                        },
                      ),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('15min',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.texteLeger)),
                          Text('1h30',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.texteLeger)),
                          Text('3h',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.texteLeger)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Authorized hours
                const Row(
                  children: [
                    Icon(AppIcons.schedule, size: 18, color: AppColors.bleuDoux),
                    SizedBox(width: 8),
                    Text(
                      'Horaires autorises',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textePrincipal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    children: [
                      _ScheduleRow(
                        label: 'Début',
                        value: params.heureDebutFormatee,
                        onTap: () => _pickTime(isStart: true),
                      ),
                      const Divider(),
                      _ScheduleRow(
                        label: 'Fin',
                        value: params.heureFinFormatee,
                        onTap: () => _pickTime(isStart: false),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Security options
                const Row(
                  children: [
                    Icon(AppIcons.security, size: 18, color: AppColors.bleuDoux),
                    SizedBox(width: 8),
                    Text(
                      'Securite',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textePrincipal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    children: [
                      _ToggleRow(
                        label: 'Mode kiosque',
                        value: params.modeKiosqueActif,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(modeKiosqueActif: v)),
                      ),
                      _ToggleRow(
                        label: 'Bloquer navigateur',
                        value: params.bloquerNavigateur,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(bloquerNavigateur: v)),
                      ),
                      _ToggleRow(
                        label: 'Bloquer téléchargements',
                        value: params.bloquerTelechargements,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(bloquerTelechargements: v)),
                      ),
                      _ToggleRow(
                        label: 'Filtrage contenu',
                        value: params.filtrageContenuActif,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(filtrageContenuActif: v)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Notifications
                const Row(
                  children: [
                    Icon(AppIcons.notification, size: 18, color: AppColors.bleuDoux),
                    SizedBox(width: 8),
                    Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textePrincipal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    children: [
                      _ToggleRow(
                        label: 'Alertes d\'activité',
                        value: params.notificationsActivite,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(notificationsActivite: v)),
                      ),
                      _ToggleRow(
                        label: 'Temps écoulé',
                        value: params.notificationsTempsEcoule,
                        onChanged: (v) => _updateParams(
                            (p) => p.copyWith(notificationsTempsEcoule: v)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _hasChanges && !_saving ? _save : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.vertNaturel,
                    ),
                    child: _saving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.blanc,
                              strokeWidth: 2,
                            ),
                          )
                        : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(AppIcons.save, size: 18),
                                      SizedBox(width: 6),
                                      Text('Enregistrer les modifications'),
                                    ],
                                  ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.bleuDoux),
        ),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Impossible de charger les paramètres'),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => ref.invalidate(
                    parametresParentauxProvider(widget.enfantId)),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickTime({required bool isStart}) async {
    final current = isStart
        ? _params!.heureDebutFormatee
        : _params!.heureFinFormatee;
    final parts = current.split(':');
    final initial = TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );

    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}:00';
      _updateParams((p) => isStart
          ? p.copyWith(heureDebut: formatted)
          : p.copyWith(heureFin: formatted));
    }
  }
}

class _ScheduleRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _ScheduleRow({
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            Row(
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.bleuDoux,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.edit, size: 16, color: AppColors.texteLeger),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleRow({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeTrackColor: AppColors.vertNaturel,
          ),
        ],
      ),
    );
  }
}
