import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../core/network/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/user_model.dart';
import '../../state/app_state.dart';
import '../dashboard/main_navigation_shell.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  UserRole _selectedRole = UserRole.guru;
  late final TextEditingController _identifierController;
  late final TextEditingController _passwordController;
  bool _obscurePassword = true;
  bool _rememberMe = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _identifierController = TextEditingController(
      text: ApiConfig.isDemoMode ? '198403152009032008' : '',
    );
    _passwordController = TextEditingController(
      text: ApiConfig.isDemoMode ? 'password123' : '',
    );
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onRoleChanged(UserRole role) {
    setState(() {
      _selectedRole = role;
      _errorMessage = null;
      if (ApiConfig.isDemoMode) {
        if (role == UserRole.guru) {
          _identifierController.text = '198403152009032008';
          _passwordController.text = 'password123';
        } else {
          _identifierController.text = '2401';
          _passwordController.text = 'password123';
        }
      } else {
        _identifierController.clear();
        _passwordController.clear();
      }
    });
  }

  Future<void> _handleLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty) {
      setState(() {
        _errorMessage = _selectedRole == UserRole.guru
            ? 'Nomor Induk Pegawai (NIP) wajib diisi'
            : 'Nomor Induk Siswa (NIS) wajib diisi';
      });
      return;
    }

    if (password.isEmpty) {
      setState(() {
        _errorMessage = 'Kata sandi wajib diisi';
      });
      return;
    }

    final appState = context.state;
    final success = await appState.login(
      identifier: identifier,
      password: password,
      role: _selectedRole,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainNavigationShell()),
        (route) => false,
      );
    } else {
      setState(() {
        _errorMessage = appState.lastErrorMessage ??
            'Kredensial tidak valid. Silakan periksa NIP/NIS dan kata sandi Anda.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.state;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Masuk SIAKAD'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.school_rounded,
                          color: AppColors.primary,
                          size: 28,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppConstants.appName,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            AppConstants.institutionShortName,
                            style: TextStyle(
                              color: Color(0xFFCCFBF1),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Selamat Datang',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Silakan pilih peran dan masukkan kredensial akun sekolah Anda:',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // Role Selector Segmented Control
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _RoleTabButton(
                        label: 'Guru / Pendidik',
                        icon: Icons.assignment_ind_rounded,
                        isSelected: _selectedRole == UserRole.guru,
                        onTap: () => _onRoleChanged(UserRole.guru),
                      ),
                    ),
                    Expanded(
                      child: _RoleTabButton(
                        label: 'Siswa',
                        icon: Icons.person_rounded,
                        isSelected: _selectedRole == UserRole.siswa,
                        onTap: () => _onRoleChanged(UserRole.siswa),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Error banner if any
              if (_errorMessage != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.alpaBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.alpa.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: AppColors.alpa,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: AppColors.alpa,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Identifier Field
              Text(
                _selectedRole == UserRole.guru
                    ? 'NIP (Nomor Induk Pegawai)'
                    : 'NIS (Nomor Induk Siswa)',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _identifierController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: _selectedRole == UserRole.guru
                      ? 'Contoh: 198403152009032008'
                      : 'Contoh: 2401',
                  prefixIcon: const Icon(
                    Icons.badge_outlined,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Password Field
              const Text(
                'Kata Sandi',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  hintText: 'Masukkan kata sandi',
                  prefixIcon: const Icon(
                    Icons.lock_outline_rounded,
                    color: AppColors.textMuted,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppColors.textMuted,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Remember Me & Forgot Password
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: Checkbox(
                          value: _rememberMe,
                          onChanged: (v) =>
                              setState(() => _rememberMe = v ?? true),
                          activeColor: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Ingat saya',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      'Lupa Password?',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Login Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: appState.isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: appState.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          'Masuk sebagai ${_selectedRole.shortLabel}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),

              // Demo quick info box
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          size: 16,
                          color: AppColors.primaryLight,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Kredensial Demo Terisi Otomatis',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _selectedRole == UserRole.guru
                          ? 'Akun: Siti Rahmawati, S.Pd. (Guru Matematika & Wali Kelas X MIPA 1).'
                          : 'Akun: Aditya Pratama Putra (Siswa & Ketua Kelas X MIPA 1).',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleTabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleTabButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
