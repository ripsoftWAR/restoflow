import 'package:flutter/material.dart';
import '../models/models.dart';

/// Central app state for PilotPOS prototype
class AppState extends ChangeNotifier {
  // ── Selected user ──
  PilotUser _selectedUser = const PilotUser(
    name: 'Kasir Utama',
    role: 'Kasir',
    shift: '09:00 - 23:00',
    seed: 'Kasir1',
    roleColor: 'blue',
  );
  PilotUser get selectedUser => _selectedUser;

  // ── PIN state ──
  String _pin = '';
  String get pin => _pin;
  int get pinLength => _pin.length;

  // ── Sync progress ──
  double _syncProgress = 0.0;
  double get syncProgress => _syncProgress;
  bool _syncComplete = false;
  bool get syncComplete => _syncComplete;

  // ── Active screen ──
  int _activeScreen = 0; // 0=splash,1=login,2=sync,3=pilihuser,4=pin,5=dashboard,6=aksicepat
  int get activeScreen => _activeScreen;

  // ── Dashboard data ──
  final List<TransactionItem> _recentTransactions = [
    const TransactionItem(invoiceId: 'INV/2505/00124', time: '10:15 WIB', type: 'Dine In', amount: 125000),
    const TransactionItem(invoiceId: 'INV/2505/00123', time: '10:02 WIB', type: 'Take Away', amount: 85000),
  ];
  List<TransactionItem> get recentTransactions => _recentTransactions;

  void selectUser(PilotUser user) {
    _selectedUser = user;
    notifyListeners();
  }

  void navigateTo(int screen) {
    _activeScreen = screen;
    notifyListeners();
  }

  void addPinDigit(String digit) {
    if (_pin.length < 6) {
      _pin += digit;
      notifyListeners();
    }
  }

  void removePinDigit() {
    if (_pin.isNotEmpty) {
      _pin = _pin.substring(0, _pin.length - 1);
      notifyListeners();
    }
  }

  void clearPin() {
    _pin = '';
    notifyListeners();
  }

  void fillPinDemo() {
    _pin = '123456';
    notifyListeners();
  }

  void resetSync() {
    _syncProgress = 0.0;
    _syncComplete = false;
    notifyListeners();
  }

  void updateSyncProgress(double progress) {
    _syncProgress = progress;
    if (progress >= 1.0) _syncComplete = true;
    notifyListeners();
  }

  void restart() {
    _pin = '';
    _syncProgress = 0.0;
    _syncComplete = false;
    _activeScreen = 0;
    notifyListeners();
  }
}
