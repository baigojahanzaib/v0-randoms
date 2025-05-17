import { GEMINI_API_KEY } from "@/lib/env"

interface GenerateCodeResponse {
  explanation: string
  files: Record<string, string>
  changedFiles?: Record<string, string>
}

export async function generateCode(
  prompt: string,
  existingFiles: Record<string, string> = {},
): Promise<GenerateCodeResponse> {
  try {
    // Prepare the prompt for Gemini
    const hasExistingFiles = Object.keys(existingFiles).length > 0

    let fullPrompt = `Generate a React Native and Expo mobile app based on this description: "${prompt}".`

    if (hasExistingFiles) {
      fullPrompt += `\n\nHere are the existing files to modify or extend:\n`
      Object.entries(existingFiles).forEach(([filename, content]) => {
        fullPrompt += `\n--- ${filename} ---\n${content}\n`
      })
      fullPrompt += `\n\nPlease provide only the files that need to be changed or added. Explain your changes.`
    } else {
      fullPrompt += `\n\nProvide a complete project structure with all necessary files for a working Expo app.`
    }

    fullPrompt += `\n\nRespond with a detailed explanation of what you built and how it works, followed by the code files.
    For each file, use the format:
    
    FILE: filename.js
    \`\`\`
    // file content here
    \`\`\`
    
    Do not use JSON format for your response.`

    // Call Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const textResponse = data.candidates[0].content.parts[0].text

    // Parse the response using regex to extract files and explanation
    const explanation = textResponse.split("FILE:")[0].trim()

    const fileRegex = /FILE:\s*([^\n]+)\n```(?:javascript|jsx|js|tsx|ts)?\n([\s\S]*?)```/g
    const files: Record<string, string> = {}
    let match

    while ((match = fileRegex.exec(textResponse)) !== null) {
      const filename = match[1].trim()
      const content = match[2].trim()
      files[filename] = content
    }

    // If no files were found, try a more lenient regex
    if (Object.keys(files).length === 0) {
      const lenientRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g

      while ((match = lenientRegex.exec(textResponse)) !== null) {
        const filename = match[1].trim()
        let content = match[2].trim()

        // Remove code block markers if present
        content = content.replace(/```(?:javascript|jsx|js|tsx|ts)?\n/g, "")
        content = content.replace(/```/g, "")

        files[filename] = content.trim()
      }
    }

    // If we still have no files, create a default App.js
    if (Object.keys(files).length === 0) {
      files["App.js"] = `
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello World! Your app is running.</Text>
      <Text>We had trouble generating your specific app.</Text>
      <Text>Please try again with more details.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
      `.trim()
    }

    // If we're updating existing files, track which files were changed
    if (hasExistingFiles) {
      const changedFiles: Record<string, string> = {}

      Object.entries(files).forEach(([filename, content]) => {
        if (!existingFiles[filename] || existingFiles[filename] !== content) {
          changedFiles[filename] = content
        }
      })

      return {
        explanation,
        files: { ...existingFiles, ...files },
        changedFiles,
      }
    }

    return {
      explanation,
      files,
    }
  } catch (error) {
    console.error("Error generating code:", error)
    throw new Error(`Failed to generate code: ${error.message}`)
  }
}
