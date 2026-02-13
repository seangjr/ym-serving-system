"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateAvatarUrl } from "@/lib/profiles/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  memberId: string;
  fullName: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  memberId,
  fullName,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const loading = isUploading || isPending;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${memberId}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setPreviewUrl(currentAvatarUrl);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with new avatar URL
      startTransition(async () => {
        const result = await updateAvatarUrl(publicUrl);
        if ("error" in result) {
          toast.error(result.error);
          setPreviewUrl(currentAvatarUrl);
        } else {
          setPreviewUrl(publicUrl);
          toast.success("Profile photo updated");
        }
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        <div className="relative">
          <Avatar className="size-32">
            <AvatarImage src={previewUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="mr-2 size-4" />
          Change Photo
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          JPG, PNG, or GIF. Max 5MB.
        </p>
      </CardContent>
    </Card>
  );
}
