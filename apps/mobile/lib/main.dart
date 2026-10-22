import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'app/app.dart';
import 'state/app_state.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Indonesian date formatting symbols for DateFormat
  await initializeDateFormatting('id_ID', null);

  final appState = AppState();

  runApp(SiakadApp(appState: appState));
}
