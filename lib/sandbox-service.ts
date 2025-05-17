import { CSB_API_KEY } from "@/lib/env"

interface SandboxResponse {
  sandboxId: string
  files: Record<string, string>
  qrCode: string
}

export async function createSandbox(
  files: Record<string, string>,
  existingSandboxId?: string,
): Promise<SandboxResponse> {
  try {
    // Prepare the files for CodeSandbox
    const sandboxFiles: Record<string, { content: string }> = {}

    // Add package.json if not provided
    if (!files["package.json"]) {
      sandboxFiles["package.json"] = {
        content: JSON.stringify(
          {
            name: "expo-app",
            version: "1.0.0",
            main: "node_modules/expo/AppEntry.js",
            scripts: {
              start: "expo start",
              android: "expo start --android",
              ios: "expo start --ios",
              web: "expo start --web",
            },
            dependencies: {
              expo: "~49.0.0",
              "expo-status-bar": "~1.6.0",
              react: "18.2.0",
              "react-dom": "18.2.0",
              "react-native": "0.72.6",
              "react-native-web": "~0.19.6",
            },
            devDependencies: {
              "@babel/core": "^7.20.0",
              "@types/react": "~18.2.14",
              typescript: "^5.1.3",
            },
            private: true,
          },
          null,
          2,
        ),
      }
    }

    // Add app.json if not provided
    if (!files["app.json"]) {
      sandboxFiles["app.json"] = {
        content: JSON.stringify(
          {
            expo: {
              name: "AI Generated App",
              slug: "ai-generated-app",
              version: "1.0.0",
              orientation: "portrait",
              icon: "./assets/icon.png",
              userInterfaceStyle: "light",
              splash: {
                image: "./assets/splash.png",
                resizeMode: "contain",
                backgroundColor: "#ffffff",
              },
              assetBundlePatterns: ["**/*"],
              ios: {
                supportsTablet: true,
              },
              android: {
                adaptiveIcon: {
                  foregroundImage: "./assets/adaptive-icon.png",
                  backgroundColor: "#ffffff",
                },
              },
              web: {
                favicon: "./assets/favicon.png",
              },
            },
          },
          null,
          2,
        ),
      }
    }

    // Add the rest of the files
    Object.entries(files).forEach(([filename, content]) => {
      if (filename !== "package.json" && filename !== "app.json") {
        sandboxFiles[filename] = { content }
      }
    })

    // Create or update the sandbox
    const endpoint = existingSandboxId
      ? `https://codesandbox.io/api/v1/sandboxes/${existingSandboxId}`
      : "https://codesandbox.io/api/v1/sandboxes/create"

    const method = existingSandboxId ? "PUT" : "POST"

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CSB_API_KEY}`,
      },
      body: JSON.stringify({
        files: sandboxFiles,
        template: "expo",
      }),
    })

    if (!response.ok) {
      throw new Error(`CodeSandbox API error: ${response.status}`)
    }

    const data = await response.json()
    const sandboxId = data.sandbox.id

    // Generate Expo QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=exp://exp.host/@codesandbox/${sandboxId}`

    return {
      sandboxId,
      files,
      qrCode: qrCodeUrl,
    }
  } catch (error) {
    console.error("Error creating sandbox:", error)
    throw new Error("Failed to create sandbox")
  }
}

export async function updateSandbox(sandboxId: string, files: Record<string, string>): Promise<void> {
  try {
    // Prepare the files for CodeSandbox
    const sandboxFiles: Record<string, { content: string }> = {}

    Object.entries(files).forEach(([filename, content]) => {
      sandboxFiles[filename] = { content }
    })

    // Update the sandbox
    const response = await fetch(`https://codesandbox.io/api/v1/sandboxes/${sandboxId}/files`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CSB_API_KEY}`,
      },
      body: JSON.stringify({
        files: sandboxFiles,
      }),
    })

    if (!response.ok) {
      throw new Error(`CodeSandbox API error: ${response.status}`)
    }
  } catch (error) {
    console.error("Error updating sandbox:", error)
    throw new Error("Failed to update sandbox")
  }
}
