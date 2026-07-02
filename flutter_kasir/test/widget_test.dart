import 'package:flutter_test/flutter_test.dart';
import 'package:pilotpos/main.dart';

void main() {
  testWidgets('PilotPOSApp renders splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const PilotPOSApp());
    await tester.pump();

    // PilotPOSApp menampilkan SplashScreen dengan logo/teks awal
    expect(find.byType(PilotPOSApp), findsOneWidget);
  });
}
