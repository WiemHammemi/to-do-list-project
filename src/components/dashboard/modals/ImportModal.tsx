
import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = [
    { key: 'title', label: 'Titre', required: true },
    { key: 'status', label: 'Statut', required: true },
    { key: 'priority', label: 'Priorité', required: true },
    { key: 'due_date', label: "Date d'échéance", required: true },
    { key: 'description', label: 'Description', required: false },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv|pdf|png|jpeg|jpg)$/)) {
      setErrors(["Le fichier doit être au format Excel (.xlsx, .xls), CSV, PDF, PNG ou JPEG"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setLoading(true);
      const response = await fetch('/api/task/import-preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse du fichier");
      }

      setDetectedColumns(data.columns);
      setPreview(data.preview);
      setColumnMapping(data.suggestedMapping || {});
      setStep(2);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Erreur lors de l'analyse du fichier"]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    const missingFields = requiredFields
      .filter(f => f.required && !columnMapping[f.key])
      .map(f => f.label);

    if (missingFields.length > 0) {
      setErrors([`Champs requis manquants: ${missingFields.join(', ')}`]);
      return;
    }

    const formData = new FormData();
    if (!file) return;
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(columnMapping));

    try {
      setLoading(true);
      setErrors([]);

      const response = await fetch('/api/task/import-preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setValidationResult(data.validation);

      if (data.validation && !data.validation.isValid) {
        setErrors(data.validation.errors);
        return;
      }

      await handleImport();
      
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Erreur lors de la validation']);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const formData = new FormData();
    if (!file) return;
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(columnMapping));

    try {
      setLoading(true);
      setStep(3);
      setErrors([]);

      const response = await fetch('/api/task/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'import");
      }

      setSuccess(data);
      setStep(4);

      if (data.imported > 0) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 3000);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Erreur lors de l'import"]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Importer des tâches</h2>
            <p className="text-sm text-gray-500 mt-1">
              Étape {step} sur 4
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Fichiers acceptés</p>
                  <p>Formats Excel (.xlsx, .xls) ou CSV</p>
                  <p>Formats PDF/Image (.pdf, .png, .jpeg, .jpg)</p>
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 mb-2">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-gray-400">
                  ou glissez-déposez votre fichier ici
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.png,.jpeg,.jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Associez les colonnes</p>
                  <p>Faites correspondre les colonnes de votre fichier avec les champs requis.</p>
                </div>
              </div>

              {preview && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Aperçu: {preview.totalRows} ligne(s) détectée(s)
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          {detectedColumns.slice(0, 5).map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 3).map((row: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            {detectedColumns.slice(0, 5).map((col) => (
                              <td key={col} className="px-3 py-2 text-gray-600">
                                {String(row[col] || '').substring(0, 30)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {requiredFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <label className="w-40 text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Sélectionner une colonne --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {validationResult && validationResult.isValid && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Validation réussie</p>
                    <p>{validationResult.validRowsCount} ligne(s) prête(s) à être importée(s)</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setStep(1);
                    setValidationResult(null);
                    setErrors([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleValidation}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                >
                  {loading ? 'Validation en cours...' : 'Valider et importer'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Import en cours...</p>
            </div>
          )}

          {step === 4 && success && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Import terminé avec succès !
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✓ {success.imported} tâche(s) importée(s)</p>
                  {success.skipped > 0 && (
                    <p>⚠ {success.skipped} ligne(s) ignorée(s)</p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-red-800 mb-2">
                    {errors.length === 1 ? 'Erreur détectée' : `${errors.length} erreur(s) détectée(s)`}
                  </p>
                  <div className="text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                    {errors.map((err, idx) => (
                      <p key={idx}>• {err}</p>
                    ))}
                  </div>
                  <p className="text-sm text-red-600 mt-3">
                    Veuillez corriger ces erreurs dans votre fichier avant de réessayer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}