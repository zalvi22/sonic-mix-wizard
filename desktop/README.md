# SonicMix Desktop

Native Mac application for SonicMix with integrated Sonic Pi bridge, TunePat watcher, and audio downloader.

## Features

- **Sonic Pi Integration**: Send code directly to Sonic Pi via OSC
- **TunePat Watcher**: Auto-import tracks from TunePat output folder
- **Audio Downloader**: Download tracks using yt-dlp (lossless support)
- **System Tray**: Quick access to all services

## Quick Start (Recommended)

**Option 1: Double-click setup**
1. Connect GitHub in Lovable and clone the repo locally
2. Double-click `desktop/setup.command` in Finder
3. Follow the prompts

**Option 2: Terminal setup**
```bash
cd desktop
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check/install prerequisites (Rust, Xcode CLI)
- Copy the React frontend from the main project
- Install all dependencies
- Prepare Tauri for building

## Manual Prerequisites

If you prefer manual setup:

### Required
1. **Rust** - Install via [rustup](https://rustup.rs/):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (v18+) - Install via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org/)

3. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

### Optional (for full functionality)
4. **Sonic Pi** - Download from [sonic-pi.net](https://sonic-pi.net/)

5. **yt-dlp** (for audio downloads):
   ```bash
   brew install yt-dlp ffmpeg
   ```

6. **TunePat** - For streaming service downloads

## Running the App

**Development mode** (hot-reload):
```bash
npm run tauri dev
```

**Production build**:
```bash
npm run tauri build
```

The `.dmg` installer will be in `src-tauri/target/release/bundle/dmg/`

## Syncing Changes

After making changes to the main web project, sync to desktop:
```bash
./sync.sh
```

## Usage

### Sonic Pi
1. Open Sonic Pi on your Mac
2. In SonicMix, the connection indicator will turn green
3. Generate code and click "Run in Sonic Pi"

### TunePat Auto-Import
1. Click the TunePat icon in the status bar
2. Set your TunePat output directory (auto-detected if standard location)
3. Start watching - new downloads will appear automatically

### Audio Downloads
1. Paste a YouTube/SoundCloud URL
2. Select format (MP3, FLAC, WAV)
3. Click download - files save to ~/Music/SonicMix Downloads

## Project Structure

```
desktop/
├── src/                    # React frontend
│   ├── lib/
│   │   └── tauri.ts       # Tauri API wrapper
│   └── ...
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Entry point & commands
│   │   ├── sonic_pi.rs    # OSC communication
│   │   ├── tunepat_watcher.rs  # File watching
│   │   └── downloader.rs  # yt-dlp wrapper
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # App configuration
└── package.json
```

## Troubleshooting

### Sonic Pi not connecting
- Ensure Sonic Pi is running
- Check that port 4560 is not blocked
- Restart Sonic Pi and try again

### TunePat not detecting files
- Verify the watch path is correct
- Check TunePat's output directory setting
- Ensure files are complete (not still downloading)

### yt-dlp errors
- Update yt-dlp: `brew upgrade yt-dlp`
- Ensure ffmpeg is installed: `brew install ffmpeg`

## Development

### Adding new Tauri commands

1. Add the Rust function in the appropriate module
2. Register it in `main.rs` with `#[tauri::command]`
3. Add to `invoke_handler` in `main()`
4. Create TypeScript wrapper in `src/lib/tauri.ts`

### Building for distribution

```bash
npm run tauri build -- --target universal-apple-darwin
```

This creates a universal binary for both Intel and Apple Silicon Macs.
