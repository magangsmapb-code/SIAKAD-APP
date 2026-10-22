import 'package:flutter/material.dart';
import '../app/constants.dart';
import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';
import '../state/app_state.dart';

class SiakadApp extends StatelessWidget {
  final AppState appState;

  const SiakadApp({super.key, required this.appState});

  @override
  Widget build(BuildContext context) {
    return AppStateScope(
      notifier: appState,
      child: Builder(
        builder: (innerContext) {
          final state = innerContext.state;
          return MaterialApp(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: state.themeMode,
            initialRoute: AppRoutes.splash,
            onGenerateRoute: AppRoutes.onGenerateRoute,
          );
        },
      ),
    );
  }
}
