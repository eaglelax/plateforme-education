import 'package:flutter/material.dart';

class AppIcons {
  AppIcons._();

  // Navigation - Child
  static const IconData home = Icons.home;
  static const IconData domains = Icons.menu_book;
  static const IconData games = Icons.sports_esports;
  static const IconData badges = Icons.emoji_events;

  // Navigation - Parent
  static const IconData family = Icons.family_restroom;
  static const IconData payment = Icons.credit_card;
  static const IconData settings = Icons.settings;

  // UI general
  static const IconData star = Icons.star;
  static const IconData lock = Icons.lock;
  static const IconData logout = Icons.logout;
  static const IconData sun = Icons.wb_sunny;
  static const IconData tip = Icons.lightbulb;
  static const IconData check = Icons.check_circle;
  static const IconData trophy = Icons.emoji_events;
  static const IconData target = Icons.track_changes;
  static const IconData fire = Icons.local_fire_department;
  static const IconData chart = Icons.bar_chart;
  static const IconData chartLine = Icons.show_chart;
  static const IconData clock = Icons.access_time;
  static const IconData schedule = Icons.schedule;
  static const IconData security = Icons.security;
  static const IconData notification = Icons.notifications;
  static const IconData save = Icons.save;
  static const IconData phone = Icons.smartphone;
  static const IconData warning = Icons.warning_amber;
  static const IconData refresh = Icons.refresh;
  static const IconData celebration = Icons.celebration;
  static const IconData muscle = Icons.fitness_center;
  static const IconData pause = Icons.pause_circle;

  // Content types
  static const IconData video = Icons.play_circle_filled;
  static const IconData audio = Icons.headphones;
  static const IconData quiz = Icons.help_outline;
  static const IconData game = Icons.sports_esports;
  static const IconData document = Icons.description;
  static const IconData activity = Icons.edit;
  static const IconData book = Icons.auto_stories;

  // Domain icons
  static const IconData reading = Icons.menu_book;
  static const IconData history = Icons.public;
  static const IconData science = Icons.science;
  static const IconData math = Icons.calculate;
  static const IconData art = Icons.palette;
  static const IconData culture = Icons.language;

  // Badge type icons
  static const IconData badgePremierPas = Icons.star;
  static const IconData badgeLecture = Icons.auto_stories;
  static const IconData badgeExploration = Icons.explore;
  static const IconData badgeCalcul = Icons.calculate;
  static const IconData badgeScience = Icons.science;
  static const IconData badgeArt = Icons.palette;

  // Mini-games
  static const IconData memory = Icons.psychology;
  static const IconData wordScramble = Icons.text_fields;
  static const IconData mathChallenge = Icons.pin;

  // Payment logos
  static const IconData orangeMoney = Icons.circle;
  static const IconData moovMoney = Icons.circle;
  static const IconData wave = Icons.circle;

  // Avatar
  static const IconData childYoung = Icons.child_care;
  static const IconData childOlder = Icons.face;

  /// Map emoji from API to Material IconData
  static IconData fromEmoji(String? emoji) {
    if (emoji == null || emoji.isEmpty) return book;
    return _emojiMap[emoji] ?? book;
  }

  static const Map<String, IconData> _emojiMap = {
    // Domain/topic emojis
    '\u{1F4DA}': reading,    // 📚
    '\u{1F5FA}': history,    // 🗺️ (note: this is the base char)
    '\u{1F52C}': science,    // 🔬
    '\u{1F9EE}': math,       // 🧮
    '\u{1F3A8}': art,        // 🎨
    '\u{1F30D}': culture,    // 🌍
    '\u{1F4D6}': book,       // 📖
    // Content type emojis
    '\u{1F3AC}': video,      // 🎬
    '\u{1F3A7}': audio,      // 🎧
    '\u2753': quiz,           // ❓
    '\u{1F3AE}': game,       // 🎮
    '\u{1F4C4}': document,   // 📄
    '\u270F\uFE0F': activity, // ✏️
    // Badge/reward emojis
    '\u{1F31F}': badgePremierPas, // 🌟
    '\u2B50': star,               // ⭐
    '\u{1F3C6}': trophy,          // 🏆
    '\u{1F512}': lock,            // 🔒
    // Game emojis
    '\u{1F9E0}': memory,          // 🧠
    '\u{1F4DD}': wordScramble,    // 📝
    '\u{1F522}': mathChallenge,   // 🔢
    // UI emojis
    '\u{1F3E0}': home,            // 🏠
    '\u{1F3AF}': target,          // 🎯
    '\u{1F4CA}': chart,           // 📊
    '\u{1F525}': fire,            // 🔥
    '\u{1F4A1}': tip,             // 💡
    '\u{1F389}': celebration,     // 🎉
    '\u{1F4AA}': muscle,          // 💪
    '\u{1F6AA}': logout,          // 🚪
    '\u{1F4F1}': phone,           // 📱
    '\u2705': check,              // ✅
    '\u26A0\uFE0F': warning,      // ⚠️
    '\u{1F514}': notification,    // 🔔
    '\u{1F4BE}': save,            // 💾
    '\u2600\uFE0F': sun,          // ☀️
    '\u{1F4C8}': chartLine,       // 📈
    '\u{1F4C5}': Icons.calendar_today, // 📅
    '\u23F1\uFE0F': clock,        // ⏱️
    '\u{1F550}': schedule,        // 🕐
    '\u{1F534}': Icons.refresh,   // 🔴 (mapped to refresh as fallback)
  };

  /// Map domain name to IconData
  static IconData fromDomainName(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('lecture') || lower.contains('langue')) return reading;
    if (lower.contains('histoire') || lower.contains('géo') || lower.contains('geo')) return history;
    if (lower.contains('science')) return science;
    if (lower.contains('logique') || lower.contains('math')) return math;
    if (lower.contains('art') || lower.contains('créa') || lower.contains('crea')) return art;
    if (lower.contains('civisme') || lower.contains('culture')) return culture;
    return book;
  }

  /// Map content type to IconData
  static IconData fromContentType(String type) {
    switch (type) {
      case 'video': return video;
      case 'audio': return audio;
      case 'quiz': return quiz;
      case 'jeu': return game;
      case 'document': return document;
      case 'activite': return activity;
      default: return book;
    }
  }

  /// Map badge type to IconData
  static IconData fromBadgeType(String? type) {
    switch (type) {
      case 'premier_pas': return badgePremierPas;
      case 'lecture': return badgeLecture;
      case 'exploration': return badgeExploration;
      case 'calcul': return badgeCalcul;
      case 'science': return badgeScience;
      case 'art': return badgeArt;
      default: return trophy;
    }
  }

  /// Avatar icon based on child age
  static IconData avatarForAge(int age) {
    return age <= 7 ? childYoung : childOlder;
  }

  /// Memory game pairs: (IconData, label)
  static List<(IconData, String)> memoryPairs(int pairCount) {
    const allPairs = [
      (Icons.public, 'Geographie'),
      (Icons.science, 'Sciences'),
      (Icons.auto_stories, 'Lecture'),
      (Icons.music_note, 'Musique'),
      (Icons.eco, 'Nature'),
      (Icons.calculate, 'Maths'),
      (Icons.palette, 'Art'),
      (Icons.history_edu, 'Histoire'),
    ];
    return allPairs.take(pairCount).toList();
  }
}
