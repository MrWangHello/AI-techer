import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/learning/presentation/learning_page.dart';
import '../../features/learning/presentation/lesson_detail_page.dart';
import '../../features/pet/presentation/pet_page.dart';
import '../../features/settings/presentation/settings_page.dart';
import '../../features/ai_tutor/presentation/chat_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/learning',
        builder: (context, state) => const LearningPage(),
      ),
      GoRoute(
        path: '/lesson/:id',
        builder: (context, state) {
          final lessonId = state.pathParameters['id']!;
          return LessonDetailPage(lessonId: lessonId);
        },
      ),
      GoRoute(
        path: '/pet',
        builder: (context, state) => const PetPage(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) => const ChatPage(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsPage(),
      ),
    ],
  );
});
