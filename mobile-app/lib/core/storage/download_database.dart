import 'package:sqflite/sqflite.dart';

class DownloadDatabase {
  static Database? _db;

  static Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = '$dbPath/downloads.db';
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE downloads (
            contenu_id INTEGER PRIMARY KEY,
            titre TEXT NOT NULL,
            type TEXT NOT NULL,
            local_path TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            download_date TEXT NOT NULL,
            has_quiz INTEGER DEFAULT 0
          )
        ''');
      },
    );
  }

  static Future<void> insertDownload({
    required int contenuId,
    required String titre,
    required String type,
    required String localPath,
    int fileSize = 0,
    bool hasQuiz = false,
  }) async {
    final db = await database;
    await db.insert(
      'downloads',
      {
        'contenu_id': contenuId,
        'titre': titre,
        'type': type,
        'local_path': localPath,
        'file_size': fileSize,
        'download_date': DateTime.now().toIso8601String(),
        'has_quiz': hasQuiz ? 1 : 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<List<Map<String, dynamic>>> getDownloads() async {
    final db = await database;
    return db.query('downloads', orderBy: 'download_date DESC');
  }

  static Future<Map<String, dynamic>?> getDownload(int contenuId) async {
    final db = await database;
    final results = await db.query(
      'downloads',
      where: 'contenu_id = ?',
      whereArgs: [contenuId],
    );
    return results.isEmpty ? null : results.first;
  }

  static Future<void> deleteDownload(int contenuId) async {
    final db = await database;
    await db.delete(
      'downloads',
      where: 'contenu_id = ?',
      whereArgs: [contenuId],
    );
  }
}
