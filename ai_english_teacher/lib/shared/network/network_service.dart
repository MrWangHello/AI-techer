import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Network service - monitors network connectivity
class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  final Connectivity _connectivity = Connectivity();
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  /// Initialize network monitoring
  Future<void> init() async {
    // Check initial connectivity
    await _checkConnectivity();

    // Listen for connectivity changes
    _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      _updateConnectivity(results);
    });
  }

  Future<void> _checkConnectivity() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _updateConnectivity(results);
    } catch (e) {
      debugPrint('Network check failed: $e');
      _isOnline = false;
    }
  }

  void _updateConnectivity(List<ConnectivityResult> results) {
    final hasConnection = results.any((result) => 
      result == ConnectivityResult.wifi ||
      result == ConnectivityResult.mobile ||
      result == ConnectivityResult.ethernet
    );

    if (_isOnline != hasConnection) {
      _isOnline = hasConnection;
      debugPrint('Network status changed: ${hasConnection ? "Online" : "Offline"}');
    }
  }

  /// Get current network level
  Future<NetworkLevel> getNetworkLevel() async {
    try {
      final results = await _connectivity.checkConnectivity();

      if (results.contains(ConnectivityResult.wifi)) {
        return NetworkLevel.fluent;
      }

      if (results.contains(ConnectivityResult.mobile)) {
        return NetworkLevel.fluent;
      }

      if (results.contains(ConnectivityResult.none)) {
        return NetworkLevel.offline;
      }

      return NetworkLevel.weak;
    } catch (e) {
      debugPrint('Network level check failed: $e');
      return NetworkLevel.offline;
    }
  }
}

enum NetworkLevel {
  fluent,
  weak,
  offline,
}
