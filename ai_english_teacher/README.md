# AI English Teacher

A Flutter-based AI English learning app for elementary students (Grade 1).

## Features

- **AI-Powered Teaching**: Uses LangChain.dart with DeepSeek/通义千问 API for intelligent tutoring
- **Voice Interaction**: STT (Speech-to-Text) and TTS (Text-to-Speech) for voice-based learning
- **Pet System**: Virtual pet that grows with learning progress
- **Course Content**: 8 units covering basic English vocabulary and sentences
- **Offline Support**: Rule engine fallback when offline
- **Multi-Platform**: Android, iOS/iPadOS, HarmonyOS NEXT (planned)

## Tech Stack

- **Framework**: Flutter 3.x
- **State Management**: Riverpod
- **AI Engine**: LangChain.dart
- **Local Database**: Isar
- **Voice**: speech_to_text + flutter_tts
- **Routing**: go_router

## Project Structure

```
lib/
├── core/                  # Core configurations
│   ├── router/           # App routing
│   ├── theme/            # App theme
│   └── constants/        # Constants
├── features/             # Feature modules
│   ├── home/            # Home page
│   ├── learning/        # Course learning
│   ├── ai_tutor/        # AI teaching engine
│   ├── pet/             # Pet system
│   ├── voice/           # Voice services
│   └── settings/        # App settings
└── shared/              # Shared utilities
    ├── database/        # Database service
    └── network/         # Network service
```

## Setup

1. Install Flutter SDK (3.x)
2. Run `flutter pub get` to install dependencies
3. Configure API keys in Settings page (optional, app works offline too)
4. Run `flutter run` to start the app

## Course Content

- Unit 1: Greetings
- Unit 2: Colors
- Unit 3: Numbers
- Unit 4: Animals
- Unit 5: Fruits
- Unit 6: Family
- Unit 7: Body
- Unit 8: Actions

## AI Engine

The app uses a three-tier AI system:
1. **Cloud API** (DeepSeek/通义千问) - Best quality, requires API key
2. **Local Model** (Qwen2-0.5B) - Offline capable (planned)
3. **Rule Engine** - Ultimate fallback, always available

## License

Private project
