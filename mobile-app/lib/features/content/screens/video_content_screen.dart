import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/providers/child_home_provider.dart';
import '../providers/download_provider.dart';
import '../../../core/utils/icon_mappings.dart';

/// Ecran 4: Contenu video avec lecteur reel
class VideoContentScreen extends ConsumerStatefulWidget {
  final int contentId;

  const VideoContentScreen({super.key, required this.contentId});

  @override
  ConsumerState<VideoContentScreen> createState() => _VideoContentScreenState();
}

class _VideoContentScreenState extends ConsumerState<VideoContentScreen> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _trackingStarted = false;
  bool _videoInitStarted = false;
  String? _currentVideoUrl;
  String? _videoError;
  double _downloadProgress = 0;
  bool _isBuffering = false;

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _initVideo(String url) async {
    // Prevent multiple initializations for the same URL
    if (_videoInitStarted && _currentVideoUrl == url) return;
    if (_videoController != null) return;

    _videoInitStarted = true;
    _currentVideoUrl = url;
    debugPrint('Video URL: $url');

    try {
      // Check if content is downloaded locally
      final downloadService = ref.read(downloadServiceProvider);
      final localPath = await downloadService.getLocalPath(widget.contentId);

      String videoFilePath;

      if (localPath != null) {
        videoFilePath = localPath;
      } else {
        // Download video via Dio to temp file (bypasses ExoPlayer URL issues)
        setState(() => _isBuffering = true);

        final tempDir = await getTemporaryDirectory();
        final ext = url.contains('.mp4') ? '.mp4' : '.video';
        videoFilePath = '${tempDir.path}/video_${widget.contentId}$ext';
        final tempFile = File(videoFilePath);

        // Skip download if already cached in temp
        if (!tempFile.existsSync() || tempFile.lengthSync() == 0) {
          final dio = Dio(BaseOptions(
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 60),
          ));

          await dio.download(
            url,
            videoFilePath,
            onReceiveProgress: (received, total) {
              if (total > 0 && mounted) {
                setState(() => _downloadProgress = received / total);
              }
            },
          );
        }

        if (!mounted) return;
        setState(() => _isBuffering = false);
      }

      _videoController = VideoPlayerController.file(File(videoFilePath));

      await _videoController!.initialize().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Délai dépassé lors de l\'initialisation vidéo.');
        },
      );
      if (!mounted) return;

      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        autoPlay: false,
        looping: false,
        aspectRatio: 16 / 9,
        placeholder: Container(
          color: const Color(0xFF1A1A2E),
          child: const Center(
            child: CircularProgressIndicator(color: AppColors.blanc),
          ),
        ),
      );
      if (mounted) setState(() {});
      _trackContentStart();
    } catch (e) {
      debugPrint('Video init error: $e');
      if (mounted) {
        setState(() {
          _videoError = e.toString();
          _isBuffering = false;
        });
      }
    }
  }

  Future<void> _trackContentStart() async {
    if (_trackingStarted) return;
    _trackingStarted = true;
    try {
      final apiClient = ref.read(apiClientProvider);
      await demarrerContenu(apiClient, widget.contentId);
    } catch (_) {
      // Non-blocking: tracking failure shouldn't affect UX
    }
  }

  Future<void> _handleDownload() async {
    final contenuAsync = ref.read(contenuDetailProvider(widget.contentId));
    final contenu = contenuAsync.valueOrNull;
    if (contenu == null || contenu.urlMedia == null) return;

    final progressNotifier = ref.read(downloadProgressProvider.notifier);
    if (progressNotifier.isDownloading(widget.contentId)) return;

    final service = ref.read(downloadServiceProvider);

    // Check if already downloaded
    final alreadyDownloaded = await service.isDownloaded(widget.contentId);
    if (alreadyDownloaded) {
      // Offer to delete
      if (!mounted) return;
      final shouldDelete = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Supprimer le téléchargement ?'),
          content: const Text(
            'Le contenu sera supprimé du stockage local.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.rougeErreur,
              ),
              child: const Text('Supprimer'),
            ),
          ],
        ),
      );
      if (shouldDelete == true) {
        await service.deleteDownload(widget.contentId);
        ref.invalidate(isDownloadedProvider(widget.contentId));
        ref.invalidate(downloadedContentsProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Téléchargement supprimé')),
          );
        }
      }
      return;
    }

    // Start download
    progressNotifier.updateProgress(widget.contentId, 0);
    try {
      await service.downloadContent(
        contenu,
        onProgress: (progress) {
          progressNotifier.updateProgress(widget.contentId, progress);
        },
      );
      progressNotifier.removeProgress(widget.contentId);
      ref.invalidate(isDownloadedProvider(widget.contentId));
      ref.invalidate(downloadedContentsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Téléchargement terminé !'),
            backgroundColor: AppColors.vertNaturel,
          ),
        );
      }
    } catch (e) {
      progressNotifier.removeProgress(widget.contentId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur de téléchargement : $e'),
            backgroundColor: AppColors.rougeErreur,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final contenuAsync = ref.watch(contenuDetailProvider(widget.contentId));
    final downloadProgress = ref.watch(downloadProgressProvider);
    final isDownloadedAsync =
        ref.watch(isDownloadedProvider(widget.contentId));

    return Scaffold(
      backgroundColor: AppColors.fondBlanc,
      body: contenuAsync.when(
        data: (contenu) {
          // Initialize video if URL exists
          if (contenu.urlMedia != null && contenu.urlMedia!.isNotEmpty) {
            _initVideo(contenu.urlMedia!);
          }

          final isDownloading =
              downloadProgress.containsKey(widget.contentId);
          final progress = downloadProgress[widget.contentId];
          final isDownloaded = isDownloadedAsync.valueOrNull ?? false;

          return CustomScrollView(
            slivers: [
              // App bar
              SliverAppBar(
                title: Text(contenu.titre,
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                pinned: true,
                actions: [
                  if (contenu.estTelechargeable &&
                      contenu.urlMedia != null)
                    IconButton(
                      onPressed: _handleDownload,
                      icon: isDownloading
                          ? SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                value: progress,
                                strokeWidth: 2,
                                color: AppColors.blanc,
                              ),
                            )
                          : Icon(
                              isDownloaded
                                  ? Icons.download_done
                                  : Icons.download,
                              color: AppColors.blanc,
                            ),
                    ),
                ],
              ),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Video player
                    if (contenu.urlMedia != null &&
                        _chewieController != null)
                      AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Chewie(controller: _chewieController!),
                      )
                    else
                      Container(
                        width: double.infinity,
                        height: 220,
                        color: const Color(0xFF1A1A2E),
                        child: Center(
                          child: _videoError != null
                              ? Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    mainAxisAlignment:
                                        MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.error_outline,
                                          size: 40,
                                          color: AppColors.rougeErreur),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'Erreur de lecture vidéo',
                                        style: TextStyle(
                                          color: AppColors.blanc,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _videoError!,
                                        style: const TextStyle(
                                          color: AppColors.grisClair,
                                          fontSize: 11,
                                        ),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 8),
                                      OutlinedButton.icon(
                                        onPressed: () {
                                          setState(() {
                                            _videoError = null;
                                            _videoInitStarted = false;
                                            _currentVideoUrl = null;
                                            _chewieController?.dispose();
                                            _videoController?.dispose();
                                            _chewieController = null;
                                            _videoController = null;
                                          });
                                        },
                                        icon: const Icon(Icons.refresh,
                                            size: 16,
                                            color: AppColors.blanc),
                                        label: const Text('Réessayer',
                                            style: TextStyle(
                                                color: AppColors.blanc)),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(
                                              color: AppColors.blanc),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : contenu.urlMedia != null
                                  ? Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        CircularProgressIndicator(
                                          value: _isBuffering && _downloadProgress > 0
                                              ? _downloadProgress
                                              : null,
                                          color: AppColors.blanc,
                                        ),
                                        if (_isBuffering) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            _downloadProgress > 0
                                                ? 'Chargement ${(_downloadProgress * 100).toInt()}%'
                                                : 'Connexion...',
                                            style: const TextStyle(
                                              color: AppColors.blanc,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ],
                                    )
                                  : Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(contenu.typeIconData,
                                            size: 48,
                                            color: AppColors.blanc),
                                        const SizedBox(height: 8),
                                        const Text(
                                          'Contenu non disponible en vidéo',
                                          style: TextStyle(
                                            color: AppColors.blanc,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                        ),
                      ),
                    // Content info
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            contenu.titre,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              if (contenu.domaineNom != null) ...[
                                Icon(
                                  contenu.domaineIconData,
                                  size: 14,
                                  color: AppColors.bleuDoux,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  contenu.domaineNom!,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.bleuDoux,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(AppIcons.star, size: 14, color: AppColors.jauneSoleil),
                                  const SizedBox(width: 2),
                                  Text(
                                    '${contenu.pointsXp} XP',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.texteSecondaire,
                                    ),
                                  ),
                                ],
                              ),
                              if (isDownloaded) ...[
                                const SizedBox(width: 12),
                                const Icon(Icons.offline_pin,
                                    size: 16,
                                    color: AppColors.vertNaturel),
                                const SizedBox(width: 4),
                                const Text(
                                  'Hors-ligne',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.vertNaturel,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            contenu.description,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.texteSecondaire,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Tip box
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: AppColors.beige,
                              borderRadius: BorderRadius.only(
                                topRight: Radius.circular(12),
                                bottomRight: Radius.circular(12),
                              ),
                              border: Border(
                                left: BorderSide(
                                  color: AppColors.jauneSoleil,
                                  width: 4,
                                ),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                const Icon(AppIcons.tip, size: 16, color: AppColors.jauneSoleil),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Le savais-tu ?',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        contenu.domaineNom != null
                                            ? 'Ce contenu fait partie du domaine "${contenu.domaineNom}" et vaut ${contenu.pointsXp} points XP !'
                                            : 'Regarde bien cette leçon pour gagner ${contenu.pointsXp} points XP !',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color:
                                              AppColors.texteSecondaire,
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          // Action button
                          if (contenu.hasQuiz)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () {
                                  context.push(
                                      '/enfant/quiz/${contenu.id}');
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      AppColors.vertNaturel,
                                ),
                                child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(AppIcons.check, size: 18),
                                      SizedBox(width: 6),
                                      Text('J\'ai compris ! Passer au quiz'),
                                    ],
                                  ),
                              ),
                            )
                          else
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => context.pop(),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      AppColors.vertNaturel,
                                ),
                                child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(AppIcons.check, size: 18),
                                      SizedBox(width: 6),
                                      Text('Lecon terminee !'),
                                    ],
                                  ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.bleuDoux),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Impossible de charger le contenu',
                    style: TextStyle(color: AppColors.rougeErreur)),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => ref
                      .invalidate(contenuDetailProvider(widget.contentId)),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
