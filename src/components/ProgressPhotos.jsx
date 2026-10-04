import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/lib/ProfileContext";
import { Image } from "@/components/ui/image";
import { fmtWeight } from "@/lib/nutrition";
import { Camera, Plus, X, Lock } from "lucide-react";

export default function ProgressPhotos() {
  const { profile } = useProfile();
  const [photos, setPhotos] = useState(null);
  const [urls, setUrls] = useState({});
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.ProgressPhoto.list("-created_date", 60);
        setPhotos(list || []);
        (list || []).forEach(async (p) => {
          try {
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
              file_uri: p.file_uri,
              expires_in: 3600,
            });
            setUrls((u) => ({ ...u, [p.id]: signed_url }));
          } catch (e) {
            /* skip broken photo */
          }
        });
      } catch (e) {
        setPhotos([]);
      }
    })();
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const rec = await base44.entities.ProgressPhoto.create({
        file_uri,
        taken_at: new Date().toISOString(),
        weight_kg: profile?.weight_kg,
      });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 3600,
      });
      setUrls((u) => ({ ...u, [rec.id]: signed_url }));
      setPhotos((p) => [rec, ...(p || [])]);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.ProgressPhoto.delete(id);
    setPhotos((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="rounded-[20px] bg-white border border-[#E2E8F0] p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-500" />
          <h2 className="font-heading font-bold text-base text-[#0F172A]">Progress photos</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-600 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Add photo"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-[11px] text-[#64748B] mb-3 flex items-center gap-1">
        <Lock className="w-3 h-3" /> Stored privately — only you can see these.
      </p>
      {!photos?.length ? (
        <p className="text-xs text-[#64748B] py-4 text-center">
          Add a photo every couple of weeks to see body changes the scale can't show.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((p) => (
            <div key={p.id} className="relative w-36 shrink-0">
              <div className="w-36 h-44 rounded-2xl overflow-hidden bg-slate-100">
                {urls[p.id] && <Image src={urls[p.id]} fittingType="fill" className="w-full h-full" />}
              </div>
              <button
                onClick={() => remove(p.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full glass text-slate-600 flex items-center justify-center"
                aria-label="Delete photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[11px] text-[#64748B] mt-1 text-center">
                {new Date(p.taken_at || p.created_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {p.weight_kg ? ` · ${fmtWeight(p.weight_kg, profile.units)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
