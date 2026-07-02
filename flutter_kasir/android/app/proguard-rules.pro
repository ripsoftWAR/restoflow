# Flutter core
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# AndroidX Lifecycle (Flutter embedding v2)
-keep class androidx.lifecycle.DefaultLifecycleObserver { *; }

# shared_preferences
-keep class androidx.preference.** { *; }
-dontwarn androidx.preference.**

# provider
-keep class provider.** { *; }
-dontwarn provider.**

# google_fonts
-keep class com.google.fonts.** { *; }
-dontwarn com.google.fonts.**

# http
-keep class org.apache.http.** { *; }
-dontwarn org.apache.http.**
-keep class io.netty.** { *; }
-dontwarn io.netty.**

# intl
-keep class intl.** { *; }
-dontwarn intl.**

# General Android
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
