import { useState, useRef } from "react";
import { useUploadContacts } from "@/hooks/use-contacts";
import { Upload as UploadIcon, FileText, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadContacts, isPending } = useUploadContacts();
  const { toast } = useToast();
  const [result, setResult] = useState<{ processed: number; duplicates: number } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    setFile(file);
    setResult(null);
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    uploadContacts(formData, {
      onSuccess: (data) => {
        setResult({ processed: data.processed, duplicates: data.duplicates });
        setFile(null);
        toast({ title: "Import Successful", description: `${data.processed} contacts imported.` });
      },
      onError: (err) => {
        toast({ 
          title: "Import Failed", 
          description: err.message, 
          variant: "destructive" 
        });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Import Contacts</h1>
        <p className="text-muted-foreground mt-1">Upload a CSV containing names and email addresses to automatically import contacts.</p>
      </div>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 ease-in-out bg-white dark:bg-black/20",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          file ? "border-green-500/50 bg-green-50/30" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept=".csv"
          onChange={handleChange}
        />

        <AnimatePresence mode="wait">
          {!file && !result ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <UploadIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold">Drag & Drop your CSV here</h3>
              <p className="text-muted-foreground max-w-sm">
                Or click the button below to browse your files. CSV should have an 'email' column (required) and 'name' column (optional).
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                Browse Files
              </button>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-green-700">Import Complete!</h3>
              <div className="flex gap-8 mt-2 text-center">
                <div>
                  <div className="text-3xl font-bold">{result.processed}</div>
                  <div className="text-sm text-muted-foreground">New Contacts</div>
                </div>
                <div className="w-px bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-amber-600">{result.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates Skipped</div>
                </div>
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-8 px-6 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted"
              >
                Import Another
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <FileText className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">{file?.name}</h3>
                <p className="text-sm text-muted-foreground">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setFile(null)}
                  className="px-6 py-2.5 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-medium transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isPending}
                  className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Process File"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <span className="font-bold">1</span>
          </div>
          <h4 className="font-bold mb-2">Upload CSV</h4>
          <p className="text-sm text-muted-foreground">Select a CSV file containing your list of target email addresses.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <span className="font-bold">2</span>
          </div>
          <h4 className="font-bold mb-2">Import Data</h4>
          <p className="text-sm text-muted-foreground">Our system parses the CSV and imports names and emails automatically.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <span className="font-bold">3</span>
          </div>
          <h4 className="font-bold mb-2">Review & Send</h4>
          <p className="text-sm text-muted-foreground">Contacts are added to the 'Pending' queue, ready for automation.</p>
        </div>
      </div>
    </div>
  );
}
