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
        <h2 className="typo-section-heading text-[var(--color-text-primary)]">
          What assets or materials do you already have?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed tabular-nums">
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
              aria-pressed={isSelected}
              className={`text-left p-4 rounded-[var(--radius-card)] border transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50'
              }`}
            >
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                {asset.name}
              </span>

              <div
                className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                    : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)]'
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
