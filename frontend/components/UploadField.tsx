"use client";

type Props = {
  label: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
};

export default function UploadField({ label, multiple, onChange }: Props) {
  return (
    <label className="block">
      <span className="text-sm text-slate">{label}</span>
      <input
        className="mt-2 block w-full text-sm text-slate"
        type="file"
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
      />
    </label>
  );
}
