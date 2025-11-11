# Asset Requirements

This directory should contain the following image assets for Expo:

## Required Assets

1. **icon.png** (1024x1024 pixels)
   - App icon for iOS and Android
   - Should be a square PNG with transparent or colored background
   - Will be resized automatically by Expo for different platforms

2. **splash.png** (1284x2778 pixels recommended)
   - Splash screen image
   - Centered image on dark background (#1a1a1a)
   - Will be resized to fit different screen sizes

3. **adaptive-icon.png** (1024x1024 pixels, Android only)
   - Android adaptive icon foreground
   - Should work on different shaped icon masks
   - Transparent background recommended

4. **favicon.png** (48x48 pixels minimum, web only)
   - Website favicon
   - Square PNG

## Temporary Solution

Until proper assets are created, you can:

1. Use the existing VitPhoeLogo.PNG as a base
2. Generate icons using an online tool like:
   - https://www.appicon.co/
   - https://makeappicon.com/
   - https://easyappicon.com/

3. Or run Expo without assets (it will use defaults with warnings):
   ```bash
   npm start
   ```

## Quick Asset Generation

If you have ImageMagick installed:

```bash
# Convert logo to icon (1024x1024)
convert VitPhoeLogo.PNG -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/icon.png

# Create splash screen (centered logo on dark background)
convert -size 1284x2778 xc:"#1a1a1a" assets/splash-bg.png
convert assets/splash-bg.png VitPhoeLogo.PNG -resize 800x800 -gravity center -composite assets/splash.png

# Create adaptive icon
convert VitPhoeLogo.PNG -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/adaptive-icon.png

# Create favicon
convert VitPhoeLogo.PNG -resize 48x48 assets/favicon.png
```

Or simply copy the logo as a placeholder:
```bash
cp VitPhoeLogo.PNG assets/icon.png
cp VitPhoeLogo.PNG assets/splash.png
cp VitPhoeLogo.PNG assets/adaptive-icon.png
cp VitPhoeLogo.PNG assets/favicon.png
```

The app will work without perfect assets - you can refine them later!
