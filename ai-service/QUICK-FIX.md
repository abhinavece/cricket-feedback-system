# Quick Fix for Pillow Installation Issue

## Problem
Pillow fails to build on Python 3.14 because it doesn't have pre-built wheels yet.

## Solutions

### Option 1: Use Python 3.11 or 3.12 (Recommended)

```bash
# Install Python 3.12 via Homebrew
brew install python@3.12

# Create venv with Python 3.12
cd ai-service
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Option 2: Install System Dependencies for Pillow (macOS)

```bash
# Install required libraries
brew install libjpeg libpng libtiff freetype

# Then try installing again
pip install --upgrade pip setuptools wheel
pip install Pillow
pip install -r requirements.txt
```

### Option 3: Use Pre-built Pillow Wheel

```bash
# Upgrade pip and install build tools
pip install --upgrade pip setuptools wheel build

# Try installing latest Pillow (may have wheels for 3.14)
pip install --upgrade Pillow

# If that works, install rest of requirements
pip install -r requirements.txt
```

### Option 4: Skip Pillow (if not needed immediately)

If you just want to test the service without image processing:

```bash
# Comment out Pillow in requirements.txt temporarily
# Then install
pip install -r requirements.txt
```

## Recommended Approach

For best compatibility, use Python 3.12:

```bash
# Check available Python versions
ls -la /usr/local/bin/python*  # or which python3.12

# Create venv with specific version
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Then update `run-local.sh` to use Python 3.12 if needed.
