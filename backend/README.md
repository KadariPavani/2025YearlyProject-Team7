# Backend Compiler Setup & Troubleshooting

This project runs user-submitted code (Python, Node.js, C, C++, Java) using local system compilers/interpreters. If C/C++ or Java submissions fail, it's usually because the system compilers are not installed or not on PATH.

## Quick checks

1. Run the helper script to test availability of compilers:

   ```bash
   node ./backend/scripts/testCompilers.js
   ```

2. If a compiler shows as **NOT AVAILABLE**, follow the platform-specific guidance below.

## Windows (common fixes)

- GCC (gcc/g++):
  - Install MSYS2 (https://www.msys2.org/) or MinGW-w64. For MSYS2, follow the installation steps and then install packages like `mingw-w64-x86_64-gcc` and add `C:\msys64\mingw64\bin` to your PATH.
  - Alternatively, enable WSL (Windows Subsystem for Linux) and install `build-essential` inside the distro.

- Java (javac/java):
  - Install a JDK (OpenJDK or Oracle JDK). Add the JDK's `bin` directory (contains `javac` and `java`) to your PATH.

- Python/Node: Install from official installers and ensure `python`/`node` are on PATH.

## Linux / macOS

- Use your package manager:
  - Debian/Ubuntu: `sudo apt update && sudo apt install build-essential openjdk-17-jdk python3 nodejs`
  - macOS (Homebrew): `brew install gcc openjdk@17 node python`

## Why Java submissions fail with "class X is public, should be declared in a file named X.java"

The Java compiler (`javac`) requires that public classes be declared in a `.java` file with the same name as the public class. This backend now detects the public class name and writes the source filename accordingly; ensure your submission declares the class properly.

## If problems persist

- Check the server logs for the judge output: it now reports clear messages when `gcc/g++/javac` are not found.
- Re-run `node ./backend/scripts/testCompilers.js` after installing tools to confirm availability.

If you'd like, I can add automated startup checks or more environment validation steps. Let me know which direction you prefer.