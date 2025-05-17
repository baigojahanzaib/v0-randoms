import { Smartphone } from "lucide-react"
import Image from "next/image"

interface MobilePreviewProps {
  qrCodeUrl: string
  sandboxId: string
}

export default function MobilePreview({ qrCodeUrl, sandboxId }: MobilePreviewProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-slate-100">
      {!sandboxId ? (
        <div className="text-center space-y-4">
          <Smartphone className="h-16 w-16 mx-auto text-slate-400" />
          <p className="text-slate-500">Your app preview will appear here once the code is generated.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-[280px] h-[580px] bg-black rounded-[36px] p-3 shadow-xl border-[14px] border-black">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl"></div>
            <div className="w-full h-full bg-white rounded-[22px] overflow-hidden">
              <iframe
                src={`https://${sandboxId}.csb.app/`}
                className="w-full h-full border-0"
                title="Mobile App Preview"
              />
            </div>
          </div>

          {qrCodeUrl && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Image src={qrCodeUrl || "/placeholder.svg"} alt="Expo QR Code" width={200} height={200} />
              </div>
              <p className="text-sm text-slate-600">Scan this QR code with the Expo Go app to preview on your device</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
