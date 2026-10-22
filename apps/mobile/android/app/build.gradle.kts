plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties
import java.io.FileInputStream
import org.gradle.api.GradleException

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

val releaseBuildRequested = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}
val requiredSigningProperties = listOf("storeFile", "keyAlias", "storePassword", "keyPassword")

if (releaseBuildRequested) {
    if (!keystorePropertiesFile.isFile) {
        throw GradleException("Release builds require android/key.properties and a release keystore.")
    }

    val missingSigningProperties = requiredSigningProperties.filter {
        keystoreProperties.getProperty(it).isNullOrBlank()
    }
    if (missingSigningProperties.isNotEmpty()) {
        throw GradleException(
            "Release signing configuration is incomplete. Missing properties: ${missingSigningProperties.joinToString()}."
        )
    }

    val releaseKeystore = file(keystoreProperties.getProperty("storeFile"))
    if (!releaseKeystore.isFile) {
        throw GradleException("The configured release keystore file was not found.")
    }
}

android {
    namespace = "sch.id.smapbngrayun.siakad_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "sch.id.smapbngrayun.siakad_mobile"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                val storeFilePath = keystoreProperties.getProperty("storeFile")
                if (storeFilePath != null) {
                    storeFile = file(storeFilePath)
                }
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
