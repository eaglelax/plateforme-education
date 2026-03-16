import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/storage/download_database.dart';
import '../models/contenu_model.dart';

class DownloadService {
  final Dio _dio;

  DownloadService(this._dio);

  /// Get the downloads directory
  Future<String> get _downloadsDir async {
    final dir = await getApplicationDocumentsDirectory();
    final downloadsDir = Directory('${dir.path}/downloads');
    if (!await downloadsDir.exists()) {
      await downloadsDir.create(recursive: true);
    }
    return downloadsDir.path;
  }

  /// Download content media to local storage
  Future<void> downloadContent(
    ContenuModel contenu, {
    void Function(double progress)? onProgress,
  }) async {
    if (contenu.urlMedia == null || contenu.urlMedia!.isEmpty) {
      throw Exception('Pas de média à télécharger');
    }

    final dir = await _downloadsDir;
    final ext = _getExtension(contenu.urlMedia!);
    final localPath = '$dir/${contenu.id}$ext';

    await _dio.download(
      contenu.urlMedia!,
      localPath,
      onReceiveProgress: (received, total) {
        if (total > 0 && onProgress != null) {
          onProgress(received / total);
        }
      },
    );

    final file = File(localPath);
    final fileSize = await file.length();

    await DownloadDatabase.insertDownload(
      contenuId: contenu.id,
      titre: contenu.titre,
      type: contenu.type,
      localPath: localPath,
      fileSize: fileSize,
      hasQuiz: contenu.hasQuiz,
    );
  }

  /// Delete a downloaded content
  Future<void> deleteDownload(int contenuId) async {
    final record = await DownloadDatabase.getDownload(contenuId);
    if (record != null) {
      final file = File(record['local_path'] as String);
      if (await file.exists()) {
        await file.delete();
      }
    }
    await DownloadDatabase.deleteDownload(contenuId);
  }

  /// Check if content is downloaded locally
  Future<bool> isDownloaded(int contenuId) async {
    final record = await DownloadDatabase.getDownload(contenuId);
    if (record == null) return false;
    final file = File(record['local_path'] as String);
    return file.exists();
  }

  /// Get local file path for a downloaded content
  Future<String?> getLocalPath(int contenuId) async {
    final record = await DownloadDatabase.getDownload(contenuId);
    if (record == null) return null;
    final path = record['local_path'] as String;
    final file = File(path);
    if (await file.exists()) return path;
    // File missing, clean up DB
    await DownloadDatabase.deleteDownload(contenuId);
    return null;
  }

  String _getExtension(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return '.mp4';
    final path = uri.path.toLowerCase();
    if (path.endsWith('.mp3')) return '.mp3';
    if (path.endsWith('.mp4')) return '.mp4';
    if (path.endsWith('.webm')) return '.webm';
    if (path.endsWith('.m4a')) return '.m4a';
    if (path.endsWith('.pdf')) return '.pdf';
    return '.mp4';
  }
}
