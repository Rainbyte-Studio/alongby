import React from 'react';
import { taxonomyService } from '../../services/taxonomyService';
import { ProjectBrief } from '../../types';
import { Input } from '../ui/Input';
import { Check } from 'lucide-react';

interface StepAssetsProps {
  brief: ProjectBrief;
  onChange: (updates: Partial<ProjectBrief>) => void;
}

export const StepAssets: React.FC<StepAssetsProps> = ({ brief, onChange }) => {
  const assets = taxonomyService.getExistingAssets();

  const handleToggleAsset = (assetId: string) => {
    const currentAssets = brief.existingAssets || [];

    if (assetId === 'nothing_yet') {
      // If clicking nothing yet, toggle it solely
      if (currentAssets.includes('nothing_yet')) {
        onChange({ existingAssets: [] });
      } else {
        onChange({ existingAssets: ['nothing_yet'] });
      }
      return;
    }

    // Remove 'nothing_yet' if selecting specific assets
    let newAssets = currentAssets.filter((a) => a !== 'nothing_yet');

    if (newAssets.includes(assetId)) {
      newAssets = newAssets.filter((a) => a !== assetId);
    } else {
      newAssets.push(assetId);
    }

    onChange({ existingAssets: newAssets });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-neutral-950 tracking-tight">
          What assets or materials do you already have?
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Letting practitioners know what already exists prevents redundant scoping and accelerates kickoff. You will also be able to upload reference files in step 8.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {assets.map((asset) => {
          const isSelected = (brief.existingAssets || []).includes(asset.id);

          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => handleToggleAsset(asset.id)}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
              }`}
            >
              <span className="text-xs font-semibold text-neutral-900">
                {asset.name}
              </span>

              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-neutral-950 text-white'
                    : 'border border-neutral-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </button>
          );
        })}
      </div>

      {(brief.existingAssets || []).includes('other') && (
        <div className="pt-2">
          <Input
            id="brief-custom-assets"
            label="Specify Other Existing Assets"
            placeholder="e.g. Existing design tokens in zeroheight, legacy database export"
            value={brief.customAssets || ''}
            onChange={(e) => onChange({ customAssets: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};
